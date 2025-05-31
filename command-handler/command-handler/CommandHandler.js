// src/command-handler/command-handler/CommandHandler.js
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
    const defaultCommands = getAllFiles(path.join(__dirname, "./commands"));
    const files = getAllFiles(this._commandsDir);
    const validations = [
      ...this.getValidations(path.join(__dirname, "validations", "syntax")),
      ...this.getValidations(this._instance.validations?.syntax),
    ];

    // Load built-in + custom command files
    for (let file of [...defaultCommands, ...files]) {
      const commandObject = require(file);
      let commandName = file.split(/[\/\\]/).pop().split(".")[0];
      const command = new Command(this._instance, commandName, commandObject);

      const {
        description,
        type,
        testOnly,
        guildOnly,
        aliases = [],
        init = () => {},
      } = commandObject;

      // Run validations & init
      for (const validation of validations) validation(command);
      await init(this._client, this._instance);

      // Register in-memory
      const names = [command.commandName, ...aliases];
      for (const name of names) {
        this._commands.set(name, command);
      }

      // Slash‐command registration
      if (type === "SLASH" || type === "BOTH") {
        const options =
          commandObject.options ||
          this._slashCommands.createOptions(commandObject);

        if (testOnly) {
          // 1) Test‐only → single test guild
          for (const guildId of this._instance.testServers) {
            await this._slashCommands.create(
              command.commandName,
              description,
              options,
              guildId
            );
          }
        } else if (guildOnly) {
          // 2) Guild‐only → _every_ guild the bot is in
          for (const [guildId] of this._client.guilds.cache) {
            await this._slashCommands.create(
              command.commandName,
              description,
              options,
              guildId
            );
          }
        }
        // 3) Global commands are handled by bulk‐overwrite below
      }
    }

    // === bulk‐overwrite global slash commands ===
    const globalDefs = [];
    for (const [, command] of this._commands) {
      const { type, testOnly, guildOnly, description, options } =
        command.commandObject;
      if (
        (type === "SLASH" || type === "BOTH") &&
        !testOnly &&
        !guildOnly
      ) {
        globalDefs.push({
          name: command.commandName,
          description,
          options:
            options || this._slashCommands.createOptions(command.commandObject),
        });
      }
    }

    try {
      console.log("🔄 Bulk-syncing global slash commands...");
      await this._client.application.commands.set(globalDefs);
      console.log("✅ Global slash commands synchronized");
    } catch (err) {
      console.error("❌ Failed bulk-sync global slash commands:", err);
    }
    // === end bulk‐overwrite ===
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
