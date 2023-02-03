const { Schema, model, models } = require("mongoose");

const welcomeChannelSchema = new Schema({
  // guildId-welcomeChannel
  _id: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
  },
});

const name = "welcome-channel";
module.exports = models[name] || model(name, welcomeChannelSchema);
