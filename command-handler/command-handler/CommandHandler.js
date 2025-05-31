// bot/command-handler/command-handler/CommandHandler.js
const path = require("path");
const getAllFiles = require("../util/get-all-files");
const Command = require("./Command");
const SlashCommands = require("./SlashCommands");
const { cooldownTypes } = require("../util/Cooldowns");
const CustomCommands = require("./CustomCommands");
const PrefixHandler = require("./PrefixHandler");
const WelcomeChannels = require("./WelcomeChannels");
const SchizoCounter = require("./SchizoCounter");

class CommandHandler {
  // <commandName, instance of the Command class>
  _commands = new Map();
  _validations = this.getValidations(
    path.join(__dirname, "validations", "runtime")
  );
  _customCommands = new CustomCommands(this);
  _prefixes = new PrefixHandler();
  _welcomeChannels = new WelcomeChannels();
  _schizoCounter = new SchizoCounter();

  constructor(instance, commandsDir, client) {
    this._instance = instance;
    this._commandsDir = commandsDir;
    this._slashCommands = new SlashCommands(client);
    this._client = client;

    this._validations = [
      ...this._validations,
      ...this.getValidations(instance.validations?.runtime),
    ];

    // Kick off reading files (which now does bulk registration for guildOnly/testOnly)
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

  async readFiles() {
    // 1) Discover built-in + user commands
    const defaultCommands = getAllFiles(path.join(__dirname, "./commands"));
    const files = getAllFiles(this._commandsDir);
    const validations = [
      ...this.getValidations(path.join(__dirname, "validations", "syntax")),
      ...this.getValidations(this._instance.validations?.syntax),
    ];

    // Arrays to hold definitions for bulk registration later
    const guildDefs = [];   // { name, description, options } for guild-only + testOnly
    const globalDefs = [];  // { name, description, options } for global (BOTH)

    // 2) Load each command file
    for (let file of [...defaultCommands, ...files]) {
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
      for (const validation of validations) validation(command);
      await init(this._client, this._instance);

      // Register in-memory (prefix or other lookups)
      const names = [command.commandName, ...aliases];
      for (const name of names) {
        this._commands.set(name, command);
      }

      // 3) Build up slash-command definitions
      if (type === "SLASH" || type === "BOTH") {
        // Use the options array provided by the command file (default to [])
        const opts = Array.isArray(options) ? options : [];

        // If it's testOnly or guildOnly, collect for bulk registration under guilds
        if (testOnly || guildOnly) {
          guildDefs.push({
            name: command.commandName,
            description,
            options: opts,
          });
        } else {
          // Otherwise it's a global command
          globalDefs.push({
            name: command.commandName,
            description,
            options: opts,
          });
        }
      }
    }

    // 4) Bulk-overwrite all guild-only (and test-only) commands in each guild (if any)
    if (guildDefs.length > 0) {
      const guildIds = Array.from(this._client.guilds.cache.keys());
      for (const guildId of guildIds) {
        await this._slashCommands.bulkRegisterGuild(guildId, guildDefs);
      }
    }

    // 5) Bulk-overwrite all global commands once
    try {
      console.log("🔄 Bulk-syncing global slash commands...");
      await this._client.application.commands.set(globalDefs);
      console.log("✅ Global slash commands synchronized");
    } catch (err) {
      console.error("❌ Failed bulk-sync global slash commands:", err);
    }

    console.log(`🔧 CommandHandler loaded ${this._commands.size} commands`);
  }

  async runCommand(command, args, message, interaction) {
    const { callback, type, cooldowns } = command.commandObject;

    // don't run SLASH commands in message context
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

    // cooldown handling (unchanged)
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

    // finally invoke the command’s callback
    return await callback(usage);
  }

  getValidations(folder) {
    if (!folder) return [];
    return getAllFiles(folder).map((filePath) => require(filePath));
  }
}

module.exports = CommandHandler;
