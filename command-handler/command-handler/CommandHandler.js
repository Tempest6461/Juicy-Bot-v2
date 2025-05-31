// bot/command-handler/command-handler/CommandHandler.js

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const getAllFiles = require("../util/get-all-files");
const Command = require("./Command");
const SlashCommands = require("./SlashCommands");
const { cooldownTypes } = require("../util/Cooldowns");
const CustomCommands = require("./CustomCommands");
const PrefixHandler = require("./PrefixHandler");
const WelcomeChannels = require("./WelcomeChannels");
const SchizoCounter = require("./SchizoCounter");

class CommandHandler {
  _commands = new Map();
  _validations = this.getValidations(
    path.join(__dirname, "validations", "runtime")
  );
  _customCommands = new CustomCommands(this);
  _prefixes = new PrefixHandler();
  _welcomeChannels = new WelcomeChannels();
  _schizoCounter = new SchizoCounter();

  /**
   * @param {Object} instance  bot configuration (contains testServers, etc.)
   * @param {string} commandsDir  Absolute path to your `bot/src/commands` folder
   * @param {import("discord.js").Client} client
   */
  constructor(instance, commandsDir, client) {
    this._instance = instance;
    this._commandsDir = commandsDir;
    this._slashCommands = new SlashCommands(client);
    this._client = client;

    this._validations = [
      ...this._validations,
      ...this.getValidations(instance.validations?.runtime),
    ];

    // On each new guild join, bulk-register guildDefs for that guild:
    client.on("guildCreate", (guild) => {
      // When a new guild is added, we rebuild guildDefs and re-register only for that guild
      const guildDefs = this.buildGuildDefinitions();
      this._slashCommands.bulkRegisterGuild(guild.id, guildDefs);
    });

    // Kick off reading files + initial bulk registration
    this.readFiles();
  }

  get commands() {
    return this._commands;
  }
  get slashCommands() {
    return this._slashCommands;
  }
  get customCommands() {
    return this._customCommands;
  }
  get prefixHandler() {
    return this._prefixes;
  }
  get welcomeChannels() {
    return this._welcomeChannels;
  }
  get schizoCounter() {
    return this._schizoCounter;
  }

  getCommandsList() {
    return Array.from(this._commands.keys());
  }

  /**
   * Recursively load all command files, return array of file paths.
   */
  getAllCommandFiles() {
    const defaultCommands = getAllFiles(path.join(__dirname, "./commands"));
    const userCommands = getAllFiles(this._commandsDir);
    return [...defaultCommands, ...userCommands];
  }

  /**
   * Builds two arrays:
   *  • guildDefs  → every command where testOnly === true or guildOnly === true
   *  • globalDefs → every command where neither flag is set (i.e. global)
   */
  buildDefinitions() {
    const validations = [
      ...this.getValidations(path.join(__dirname, "validations", "syntax")),
      ...this.getValidations(this._instance.validations?.syntax),
    ];

    const guildDefs = [];
    const globalDefs = [];

    for (const file of this.getAllCommandFiles()) {
      const commandObject = require(file);
      const commandName = path.basename(file).split(".")[0];
      const command = new Command(this._instance, commandName, commandObject);

      const {
        description,
        type,
        testOnly,
        guildOnly,
        aliases = [],
        init = () => {},
        options = [],
      } = commandObject;

      // Run validations & init
      for (const validation of validations) {
        validation(command);
      }
      init(this._client, this._instance);

      // Register in-memory (prefix or other lookups)
      const names = [command.commandName, ...aliases];
      for (const name of names) {
        this._commands.set(name, command);
      }

      // Build slash-command definitions
      if (type === "SLASH" || type === "BOTH") {
        const opts = Array.isArray(options) ? options : [];

        if (testOnly || guildOnly) {
          guildDefs.push({
            name: command.commandName,
            description,
            options: opts,
          });
        } else {
          globalDefs.push({
            name: command.commandName,
            description,
            options: opts,
          });
        }
      }
    }

    return { guildDefs, globalDefs };
  }

  /**
   * On startup: reads command files, builds definitions, and then:
   *  1️⃣ Bulk-register guildDefs in existing guilds IF they changed since last run.
   *  2️⃣ Bulk-sync globalDefs once.
   */
  async readFiles() {
    const { guildDefs, globalDefs } = this.buildDefinitions();

    // 4) Bulk-register guild-only commands in existing guilds (with hash check)
    await this.bulkRegisterGuildsIfChanged(guildDefs);

    // 5) Bulk-sync global commands once
    try {
      console.log("🔄 Bulk-syncing global slash commands...");
      await this._client.application.commands.set(globalDefs);
      console.log("✅ Global slash commands synchronized");
    } catch (err) {
      console.error("❌ Failed bulk-sync global slash commands:", err);
    }

    console.log(`🔧 CommandHandler loaded ${this._commands.size} commands`);
  }

  /**
   * Computes an MD5 of guildDefs, compares with cache, and if changed,
   * bulk-registers guildDefs in *each* existing guild (staggered).
   */
  async bulkRegisterGuildsIfChanged(guildDefs) {
    const CACHE_DIR = path.join(this._commandsDir, "..", ".cache");
    const HASH_FILE = path.join(CACHE_DIR, "commands_hash.txt");

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const newHash = crypto.createHash("md5").update(JSON.stringify(guildDefs)).digest("hex");
    let oldHash = null;
    if (fs.existsSync(HASH_FILE)) {
      oldHash = fs.readFileSync(HASH_FILE, "utf8");
    }

    if (oldHash === newHash) {
      console.log("→ [CommandHandler] No guild-only command changes detected; skipping bulk registration.");
      return;
    }

    // Write new hash
    fs.writeFileSync(HASH_FILE, newHash, "utf8");

    if (guildDefs.length === 0) {
      console.log("→ [CommandHandler] No guild-only commands to register.");
      return;
    }

    console.log(`→ [CommandHandler] Detected ${guildDefs.length} guild-only commands; registering in all guilds...`);

    const guildIds = Array.from(this._client.guilds.cache.keys());
    if (guildIds.length === 0) {
      console.log("→ [CommandHandler] Bot is in no guilds; nothing to register.");
      return;
    }

    // Bulk-overwrite in parallel, staggered by 250ms per guild
    const restPromises = guildIds.map((guildId, idx) => {
      return new Promise((resolve) => {
        const delay = 250 * idx;
        setTimeout(async () => {
          await this._slashCommands.bulkRegisterGuild(guildId, guildDefs);
          resolve();
        }, delay);
      });
    });

    await Promise.all(restPromises);
    console.log(`✅ [CommandHandler] Finished bulk-registering guild-only commands.`);
  }

  async runCommand(command, args, message, interaction) {
    const { callback, type, cooldowns } = command.commandObject;
    if (message && type === "SLASH") return;

    const guild = message ? message.guild : interaction.guild;
    const member = message ? message.member : interaction.member;
    const user = message ? message.author : interaction.user;
    const channel = message ? message.channel : interaction.channel;

    const usage = {
      instance: command.instance,
      message,
      interaction,
      args,
      text: args.join(" "),
      guild,
      member,
      user,
      channel,
      client: this._client,
    };

    // runtime validations
    for (const validation of this._validations) {
      if (!(await validation(command, usage, this._prefixes.get(guild?.id)))) {
        return;
      }
    }

    // cooldown handling
    if (cooldowns) {
      let cooldownType;
      for (const t of cooldownTypes) {
        if (cooldowns[t]) {
          cooldownType = t;
          break;
        }
      }
      const cooldownUsage = {
        cooldownType,
        userId: user.id,
        actionId: `command_${command.commandName}`,
        guildId: guild?.id,
        duration: cooldowns[cooldownType],
        errorMessage: cooldowns.errorMessage,
      };
      const result = this._instance.cooldowns.canRunAction(cooldownUsage);
      if (typeof result === "string") return result;
      await this._instance.cooldowns.start(cooldownUsage);
      usage.cancelCooldown = () => {
        this._instance.cooldowns.cancelCooldown(cooldownUsage);
      };
      usage.updateCooldown = (expires) => {
        this._instance.cooldowns.updateCooldown(cooldownUsage, expires);
      };
    }

    return await callback(usage);
  }

  getValidations(folder) {
    if (!folder) return [];
    return getAllFiles(folder).map((filePath) => require(filePath));
  }
}

module.exports = CommandHandler;
