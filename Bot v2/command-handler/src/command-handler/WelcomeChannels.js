const welcomeChannelSchema = require("../models/welcome-channel-schema");

class WelcomeHandler {
  _welcomeChannels = new Map();

  async action(action, guildId, channelId) {
    const _id = `${guildId}`;

    const result = await welcomeChannelSchema.findOneAndUpdate(
      {
        _id: guildId,
      },
      {
        _id: guildId,
        [action === "add" ? "$set" : "$unset"]: {
          channelId,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
  //  console.log(result)
    this._welcomeChannels.set(guildId, result.channelId);
    return result.channelId;
  }

  async add(guildId, channelId) {
    return await this.action("add", guildId, channelId);
  }

  async remove(guildId) {
    return await this.action("remove", guildId);
  }

  async getWelcomeChannel(guildId) {
    let channel = this._welcomeChannels.get(guildId);

    if (!channel) {
      const result = await welcomeChannelSchema.findById(guildId);
      channel = result ? result.channelId : null;
      this._welcomeChannels.set(guildId, channel);
    }
    return channel;
  }
}

module.exports = WelcomeHandler;
