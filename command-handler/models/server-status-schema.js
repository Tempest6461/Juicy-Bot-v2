const { Schema, model, models } = require("mongoose");

const serverStatusSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  serverIP: {
    type: String,
    required: true,
  },
  interval: {
    type: Number,
    required: true,
  },
  channelIds: {
    type: [String],  // Store an array of channel IDs
    default: [],     // Default to an empty array
  },
});

const name = "server-status";
module.exports = models[name] || model(name, serverStatusSchema);