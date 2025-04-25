const { InteractionType } = require("discord.js");
const path = require("path");
const getAllFiles = require("../util/get-all-files");

class EventHandler {
  // Map<eventName, Array<[handlerFunction, dynamicValidation?]>>
  _eventCallbacks = new Map();

  constructor(instance, events, client) {
    this._instance = instance;
    this._eventsDir = events?.dir;
    this._client = client;

    // Remove the dir property and store remaining event settings
    delete events.dir;
    this._events = events;

    // Built-in validations for core discord.js events
    this._builtInEvents = {
      interactionCreate: {
        isButton: (interaction) => interaction.isButton(),
        isCommand: (interaction) =>
          interaction.type === InteractionType.ApplicationCommand ||
          interaction.type === InteractionType.ApplicationCommandAutocomplete,
      },
      messageCreate: {
        isHuman: (message) => !message.author.bot,
      },
    };

    this.readFiles();
    this.registerEvents();
  }

  async readFiles() {
    const defaultEvents = getAllFiles(path.join(__dirname, "events"), true);
    const folders = this._eventsDir ? getAllFiles(this._eventsDir, true) : [];

    for (const folderPath of [...defaultEvents, ...folders]) {
      const event = folderPath.split(/[\/\\]/g).pop();
      const files = getAllFiles(folderPath);

      const functions = this._eventCallbacks.get(event) || [];

      for (const file of files) {
        const isBuiltIn = !folderPath.includes(this._eventsDir);
        const func = require(file);
        const result = [func];

        const split = file.split(event)[1].split(/[\/\\]/g);
        const methodName = split[split.length - 2];

        if (
          isBuiltIn &&
          this._builtInEvents[event] &&
          this._builtInEvents[event][methodName]
        ) {
          result.push(this._builtInEvents[event][methodName]);
        } else if (this._events[event] && this._events[event][methodName]) {
          result.push(this._events[event][methodName]);
        }

        functions.push(result);
      }

      this._eventCallbacks.set(event, functions);
    }
  }

  registerEvents() {
    // Register each event with try/catch around handlers
    for (const [eventName, functions] of this._eventCallbacks) {
      this._client.on(eventName, async (...args) => {
        for (const [func, dynamicValidation] of functions) {
          if (dynamicValidation && !(await dynamicValidation(...args))) {
            continue;
          }
          try {
            await func(...args, this._instance);
          } catch (err) {
            console.error(`Error in ${eventName} handler:`, err);
          }
        }
      });
    }

    // Special case for @mentions handler
    const handleMentionFunc = require("../../src/events/messageCreate/mentioned");
    const dynamicValidation = (message) => !message.author.bot;
    this._client.on("messageCreate", async (message) => {
      if (dynamicValidation && !(await dynamicValidation(message))) {
        return;
      }
      try {
        handleMentionFunc(this._client, message);
      } catch (err) {
        console.error("Error in messageCreate mention handler:", err);
      }
    });

    // Catch any unhandled client errors to prevent process crash
    this._client.on("error", (err) => {
      console.error("Discord client error:", err);
    });
  }
}

module.exports = EventHandler;
