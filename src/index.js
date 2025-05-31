// bot/src/index.js
require("dotenv/config");

const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Partials, ActivityType } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { Manager } = require("magmastream");
const mongoose = require("mongoose");

// ── Use the official wrapper; leave everything in command-handler untouched ──
const CommandHandler = require("../command-handler");
const MusicHandler   = require("../command-handler/command-handler/MusicHandler");

(async () => {
  try {
    // 1️⃣ Connect to MongoDB
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // 2️⃣ Instantiate your Discord client
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Channel],
    });

    // 3️⃣ Configure Lavalink via MagmaStream
    client.magma = new Manager({
      nodes: [{
        host:       "127.0.0.1",
        port:       2333,
        password:   "Grizzly101*",
        identifier: "MainNode",
        secure:     false,
      }],
      send: (guildId, payload) => {
        const g = client.guilds.cache.get(guildId);
        if (g) g.shard.send(payload);
      },
      autoPlay: false,
    });
    client.on("raw",             (d) => client.magma.updateVoiceState(d));
    client.on("voiceStateUpdate", (oldState, newState) => {
      const guildId = oldState.guild.id;
      const player  = client.magma.players.get(guildId);
      if (!player) return;
      const vc = player.voiceChannel;
      if (!vc) return;
      if (oldState.channelId === vc) {
        const ch = oldState.guild.channels.cache.get(vc);
        if (ch?.members.filter((m) => !m.user.bot).size === 0) {
          try { player.destroy(); }
          catch (err) { console.error(`Error stopping music: ${err.message}`); }
        }
      }
    });

    // ────────────────────────────────────────────────────────────────────────────
    // Helper: Recursively load ALL slash commands from `src/commands/`, except those
    // explicitly marked `guildOnly: false` (i.e. intended as global).
    function loadAllSlashCommands() {
      const commands = [];
      const commandsPath = path.join(__dirname, "commands");

      function recurse(folder) {
        const entries = fs.readdirSync(folder, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(folder, entry.name);

          if (entry.isDirectory()) {
            recurse(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(".js")) {
            const cmd = require(fullPath);

            // Only collect commands that export a `data` (SlashCommandBuilder)
            // and either have `guildOnly !== false` (i.e. default or true).
            //
            // If you explicitly set `guildOnly: false`, it means "global only"—skip here.
            if (cmd.data && cmd.guildOnly !== false) {
              commands.push(cmd.data.toJSON());
            }
          }
        }
      }

      recurse(commandsPath);
      return commands;
    }

    // 4️⃣ When the client is ready, hook up your handlers
    client.once("ready", async () => {
      console.log(`Logged in as ${client.user.tag}!`);
      client.user.setActivity("Music 🎶", { type: ActivityType.Playing });
      console.log("🔌 Lavalink initialized");
      client.magma.init(client.user.id);

      // Music-specific handler (play, pause, etc.)
      client.musicHandler = new MusicHandler(client);

      // ── COMMAND HANDLER ─────────────────────────────────────────────────────
      const handler = new CommandHandler({
        client,
        mongoUri:    process.env.MONGO_URI,
        commandsDir: path.join(__dirname, "commands"),
        testServers: ["529877137268670465"], // Only your dev/test guild ID
        botOwners: [
          "131562657680457729",
          "1014618816115916871",
          "243432636972793856",
          "1052879147392835634",
        ],
        cooldownConfig: {
          errorMessage:   "Please wait {TIME}",
          botOwnerBypass: true,
          dbRequired:     300,
        },
        events: {
          dir: path.join(__dirname, "events"),
          interactionCreate: { isButton: (i) => i.isButton() },
          messageCreate:     { isHuman:  (m) => !m.author.bot },
          validations: {
            runtime: path.join(__dirname, "validations", "runtime"),
            syntax:  path.join(__dirname, "validations", "syntax"),
          },
        },
      });

      // Expose for use in /help, prefix handlers, etc.
      client.commandHandler = handler;
      console.log("🔧 CommandHandler initialized");

      // ─────────────────────────────────────────────────────────────────────────
      // Dynamic registration for guild-only (and default) commands across all guilds:
      const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
      const slashCommandsToRegister = loadAllSlashCommands();

      if (slashCommandsToRegister.length > 0) {
        client.guilds.cache.forEach(async (guild) => {
          try {
            await rest.put(
              Routes.applicationGuildCommands(client.user.id, guild.id),
              { body: slashCommandsToRegister }
            );
            console.log(`→ Registered ${slashCommandsToRegister.length} commands in ${guild.id}`);
          } catch (err) {
            console.warn(`→ Failed to register in ${guild.id}: ${err.message}`);
          }
        });
      } else {
        console.log("→ No guild-only/unspecified commands found to register.");
      }
      // └────────────────────────────────────────────────────────────────────────
    });

    // 5️⃣ When the bot joins a new guild, register (almost) all commands there immediately
    client.on("guildCreate", async (guild) => {
      console.log(`✨ Joined new guild: ${guild.id} (“${guild.name}”). Registering commands…`);

      const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
      const slashCommandsToRegister = loadAllSlashCommands();

      try {
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, guild.id),
          { body: slashCommandsToRegister }
        );
        console.log(`✅ Registered ${slashCommandsToRegister.length} commands in new guild ${guild.id}`);
      } catch (err) {
        console.error(`❌ Could not register in ${guild.id}: ${err.message}`);
      }
    });

    // 6️⃣ Finally, log in to Discord
    await client.login(process.env.TOKEN);
  } catch (err) {
    console.error("❌ Failed to connect or login:", err);
    process.exit(1);
  }
})();
