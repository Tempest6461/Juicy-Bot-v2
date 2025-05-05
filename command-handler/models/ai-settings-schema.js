// command-handler/models/ai-settings-schema.js
const mongoose = require('mongoose');

const aiSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    chimeChannelIds: { type: [String], default: [] },
    chimeRate: { type: Number, default: 0 },
  });

module.exports = mongoose.models.AISettings ||
  mongoose.model('AISettings', aiSettingsSchema);
