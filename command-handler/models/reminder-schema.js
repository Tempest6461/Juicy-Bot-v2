// command-handler/models/reminder-schema.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const reminderSchema = new Schema({
  userId:    { type: String, required: true },
  guildId:   { type: String, required: true },
  channelId: { type: String, required: true },
  remindAt:  { type: Date,   required: true },
  content:   { type: String, required: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Reminder", reminderSchema);
