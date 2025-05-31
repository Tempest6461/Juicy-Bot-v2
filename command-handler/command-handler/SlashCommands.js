// src/command-handler/command-handler/SlashCommands.js

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

class SlashCommands {
  constructor(client) {
    this._client = client;

    // When the bot joins a new guild, bulk-register all guild-only commands there
    this._client.on("guildCreate", (guild) => {
      this.bulkRegisterGuild(guild.id);
    });
  }

  /**
   * Recursively loads all commands under src/commands, excluding those with guildOnly: false
   * (i.e. commands explicitly meant to be global). Returns an array of JSON objects.
   */
  loadAllGuildCommands() {
    const results = [];
    // Adjust this path if your commands folder is somewhere else:
    const commandsDir = path.join(__dirname, "..", "..", "..", "bot", "src", "commands");

    function recurse(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          recurse(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
          const cmd = require(fullPath);
          // Only include commands that export `data` and have guildOnly !== false
          if (cmd.data && cmd.guildOnly !== false) {
            results.push(cmd.data.toJSON());
          }
        }
      }
    }

    if (fs.existsSync(commandsDir)) {
      recurse(commandsDir);
    }
    return results;
  }

  /**
   * Bulk-overwrites _all_ guild-only slash commands in the given guild.
   * This sends a single PUT request to /applications/<botId>/guilds/<guildId>/commands.
   */
  async bulkRegisterGuild(guildId) {
    const commandsJSON = this.loadAllGuildCommands();
    if (commandsJSON.length === 0) {
      console.log("→ No guild-only commands to register for guild:", guildId);
      return;
    }

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    try {
      await rest.put(
        Routes.applicationGuildCommands(this._client.user.id, guildId),
        { body: commandsJSON }
      );
      console.log(`✅ Bulk-registered ${commandsJSON.length} commands in guild ${guildId}`);
    } catch (err) {
      console.error(`❌ Failed to bulk-register in guild ${guildId}: ${err.message}`);
    }
  }

  /**
   * On bot startup, this iterates through every guild the bot is already in,
   * detects if any guild-only commands have changed (via a simple MD5 hash), and—
   * if so—bulk-overwrites them in parallel (with a stagger) across all guilds.
   */
  async bulkRegisterAllGuilds() {
    const CACHE_DIR = path.join(__dirname, "..", "..", "..", "bot", "src", ".cache");
    const HASH_FILE = path.join(CACHE_DIR, "commands_hash.txt");

    // Ensure cache directory exists
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    // Load current guild-only commands and compute MD5 hash
    const commandsJSON = this.loadAllGuildCommands();
    const newHash = crypto.createHash("md5").update(JSON.stringify(commandsJSON)).digest("hex");

    // Read old hash (if any)
    let oldHash = null;
    if (fs.existsSync(HASH_FILE)) {
      oldHash = fs.readFileSync(HASH_FILE, "utf8");
    }

    // If nothing changed, skip registration entirely
    if (oldHash === newHash) {
      console.log("→ No guild-only command changes detected; skipping bulk registration.");
      return;
    }

    // Otherwise, write new hash and proceed
    fs.writeFileSync(HASH_FILE, newHash, "utf8");
    console.log(`→ Detected ${commandsJSON.length} guild-only commands to (re)register.`);

    // Gather all guild IDs from cache
    const guildIds = Array.from(this._client.guilds.cache.keys());
    if (guildIds.length === 0) {
      console.log("→ Bot is in no guilds; nothing to register.");
      return;
    }

    // Bulk-overwrite in parallel (staggered by 250ms per guild to respect rate limits)
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    const promises = guildIds.map((guildId, index) => {
      return new Promise((resolve) => {
        const delay = 250 * index; // 250ms * index
        setTimeout(async () => {
          try {
            await rest.put(
              Routes.applicationGuildCommands(this._client.user.id, guildId),
              { body: commandsJSON }
            );
            console.log(`→ Bulk-registered ${commandsJSON.length} commands in ${guildId}`);
            resolve({ guildId, success: true });
          } catch (err) {
            console.warn(`→ Failed bulk-register in ${guildId}: ${err.message}`);
            resolve({ guildId, success: false });
          }
        }, delay);
      });
    });

    const results = await Promise.all(promises);
    const successCount = results.filter((r) => r.success).length;
    console.log(`✅ Bulk registration complete: ${successCount}/${guildIds.length} succeeded.`);
  }
}

module.exports = SlashCommands;
