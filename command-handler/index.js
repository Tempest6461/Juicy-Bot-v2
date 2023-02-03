const mongoose = require("mongoose");

const CommandHandler = require("./command-handler/CommandHandler");
const Cooldowns = require("./util/Cooldowns");
const EventHandler = require("./event-handler/EventHandler");

class Main {
  constructor(obj) {
    this.init(obj);
  }

  async init({
    client,
    mongoUri,
    commandsDir,
    testServers = [],
    botOwners = [],
    cooldownConfig = {},
    disabledDefaultCommands = [],
    events = {},
    validations = {},
  }) {
    if (!client) {
      throw new Error("A client is required.");
    }

    this._testServers = testServers;
    this._botOwners = botOwners;
    this._cooldowns = new Cooldowns({
      instance: this,
      ...cooldownConfig,
    });
    this._disabledDefaultCommands = disabledDefaultCommands.map((cmd) =>
      cmd.toLowerCase()
    );
    this._validations = validations;

    if (mongoUri) {
      mongoose.set('strictQuery', false);
      await this.connectToMongo(mongoUri);
    }

    if (commandsDir) {
      this._commandHandler = new CommandHandler(this, commandsDir, client);
    }

    this._eventHandler = new EventHandler(this, events, client);
  }

  get testServers() {
    return this._testServers;
  }

  get botOwners() {
    return this._botOwners;
  }

  get cooldowns() {
    return this._cooldowns;
  }

  get disabledDefaultCommands() {
    return this._disabledDefaultCommands;
  }

  get commandHandler() {
    return this._commandHandler;
  }

  get eventHandler() {
    return this._eventHandler;
  }

  get validations() {
    return this._validations;
  }

  async connectToMongo(mongoUri) {
    await mongoose.connect(mongoUri, {
      keepAlive: true,
    });
  }
}

module.exports = Main;
