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

    // Load every command file (built-in + custom)
    for (let file of [...defaultCommands, ...files]) {
      const commandObject = require(file);

      // Derive commandName from filename
      let commandName = file
        .split(/[\/\\]/)
        .pop()
        .split(".")[0];
      const command = new Command(this._instance, commandName, commandObject);

      // Extract the bits we need (no more `delete` or disabledDefaultCommands)
      const {
        description,
        type,
        testOnly,
        aliases = [],
        init = () => {},
      } = commandObject;

      // Run any validations
      for (const validation of validations) {
        validation(command);
      }

      // Call the command’s init (e.g. event-handlers, etc.)
      await init(this._client, this._instance);

      // Register it in our in-memory Map under each name & alias
      const names = [command.commandName, ...aliases];
      for (const name of names) {
        this._commands.set(name, command);
      }

      // If it’s a slash-type command, register with Discord
      if (type === "SLASH" || type === "BOTH") {
        const options =
          commandObject.options ||
          this._slashCommands.createOptions(commandObject);

        if (testOnly) {
          for (const guildId of this._instance.testServers) {
            await this._slashCommands.create(
              command.commandName,
              description,
              options,
              guildId
            );
          }
        } else {
          await this._slashCommands.create(
            command.commandName,
            description,
            options
          );
        }
      }
    }

    // === bulk‐prune stale slash commands ===
    const globalSlashCommands = new Set();
    const guildSlashCommands = new Set();

    // Build sets of the names you just registered
    for (const [, command] of this._commands) {
      const { type, testOnly } = command.commandObject;
      if (type === "SLASH" || type === "BOTH") {
        if (testOnly) guildSlashCommands.add(command.commandName);
        else globalSlashCommands.add(command.commandName);
      }
    }

    // 1) Prune GLOBAL commands
    const existingGlobal = await this._slashCommands.getCommands();
    if (existingGlobal) {
      for (const cmd of existingGlobal.cache.values()) {
        if (!globalSlashCommands.has(cmd.name)) {
          console.log(`⛔ Pruning global slash command ${cmd.name}`);
          await this._slashCommands.delete(cmd.name);
        }
      }
    } else {
      console.warn(
        "[SlashCommands] Skipping global prune: manager unavailable"
      );
    }

    // 2) Prune GUILD (test) commands
    for (const guildId of this._instance.testServers) {
      const existingGuild = await this._slashCommands.getCommands(guildId);
      if (!existingGuild) {
        console.warn(
          `[SlashCommands] Skipping prune for unknown or unavailable guild ${guildId}`
        );
        continue;
      }
      for (const cmd of existingGuild.cache.values()) {
        if (!guildSlashCommands.has(cmd.name)) {
          console.log(
            `⛔ Pruning guild (${guildId}) slash command ${cmd.name}`
          );
          await this._slashCommands.delete(cmd.name, guildId);
        }
      }
    }
    // === end bulk‐prune ===
  }

  async runCommand(command, args, message, interaction) {
    const { callback, type, cooldowns } = command.commandObject;

    if (message && type === "SLASH") {
      return;
    }

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

    for (const validation of this._validations) {
      if (!(await validation(command, usage, this._prefixes.get(guild?.id)))) {
        return;
      }
    }

    if (cooldowns) {
      let cooldownType;

      for (const type of cooldownTypes) {
        if (cooldowns[type]) {
          cooldownType = type;
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

      if (typeof result === "string") {
        return result;
      }

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
    if (!folder) {
      return [];
    }
    // console.log(folder);
    const validations = getAllFiles(folder).map((filePath) =>
      require(filePath)
    );

    return validations;
  }
}

module.exports = CommandHandler;
