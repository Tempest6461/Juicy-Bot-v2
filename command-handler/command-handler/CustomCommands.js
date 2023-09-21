const customCommandSchema = require("../models/custom-command-schema");

class CustomCommands {
  // guildId-commandName: response
  _customCommands = new Map();

  constructor(commandHandler) {
    this._commandHandler = commandHandler;
    this.loadCommands();
  }

  async loadCommands() {
    const results = await customCommandSchema.find({});

    for (const result of results) {
      const { _id, response } = result;
      this._customCommands.set(_id, response);
    }
  }

  async create(guildId, commandName, description, response) {
    const _id = `${guildId}-${commandName}`;

    this._customCommands.set(_id, response);

    this._commandHandler.slashCommands.create(
      commandName,
      description,
      [],
      guildId
    );

    await customCommandSchema.findOneAndUpdate(
      {
        _id,
      },
      {
        _id,
        response,
      },
      {
        upsert: true,
      }
    );
  }

  async delete(guildId, commandName) {
    const _id = `${guildId}-${commandName}`;

    this._customCommands.delete(_id);

    this._commandHandler.slashCommands.delete(commandName, guildId);

    await customCommandSchema.deleteOne({ _id });
  }

  async deleteAll(guildId) {
    try {
      // Find all custom commands associated with the guild and delete them
      const result = await customCommandSchema
        .deleteMany({ _id: { $regex: `^${guildId}-` } })
        .exec();

      // Clear the custom commands stored in memory for the guild
      for (const key of this._customCommands.keys()) {
        if (key.startsWith(`${guildId}-`)) {
          this._customCommands.delete(key);
        }
      }

      console.log(
        `Deleted ${result.deletedCount} custom commands for guild ${guildId}`
      );
      return result.deletedCount;
    } catch (error) {
      console.error("Error deleting custom commands:", error);
      throw error;
    }
  }

  customCommandExists(guildId, commandName) {
    const _id = `${guildId}-${commandName}`;
    return this._customCommands.has(_id);
  }

  async run(commandName, message, interaction) {
    const guild = message ? message.guild : interaction.guild;
    if (!guild) {
      return;
    }

    const _id = `${guild.id}-${commandName}`;
    const response = this._customCommands.get(_id);
    if (!response) {
      return;
    }

    if (message) message.channel.send(response).catch(() => {});
    else if (interaction) interaction.reply(response).catch(() => {});
  }

  async getAllCommandsForGuild(guildId) {
    try {
      const commands = await customCommandSchema
        .find({ _id: { $regex: `^${guildId}-` } })
        .exec();
      const resolvedCommands = await commands; // Resolve the Promise
      // console.log("Commands from Database:", resolvedCommands);
      return resolvedCommands;
    } catch (error) {
      console.error("Error fetching custom commands:", error);
      return [];
    }
  }
}

module.exports = CustomCommands;
