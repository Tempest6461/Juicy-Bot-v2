const { Schema, model, models } = require("mongoose");

const serverStatusSchema = new Schema({
  // guildId-serverIP (unique identifier)
  _id: {
    type: String,
    required: true,
  },
  serverIP: {
    type: String,
    required: true,
  },
  interval: {
    type: Number, // Interval in minutes
    required: true,
  },
  channelId: {
    type: String,  // Optional: Store the channel ID where the status updates should be sent
    default: null,
  },
});

const name = "server-status";
module.exports = models[name] || model(name, serverStatusSchema);
