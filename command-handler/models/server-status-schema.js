const { Schema, model, models } = require("mongoose");

const serverStatusSchema = new Schema({
  _id: { type: String, required: true }, // Server IP as unique identifier
  serverIP: { type: String, required: true }, // Server IP address
  isMonitoring: { type: Boolean, default: false }, // Whether monitoring is active
  channelIds: { type: [String], default: [] }, // Array of associated channels
  lastChecked: { type: Number, default: null }, // Timestamp of the last status check
  previousStatus: { type: Boolean, default: null }, // Tracks the last known status (true = online, false = offline)
});

const name = "server-status";
module.exports = models[name] || model(name, serverStatusSchema);
