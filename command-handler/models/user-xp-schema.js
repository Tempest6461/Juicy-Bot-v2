const mongoose = require("mongoose");

const userXpSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  xp: {
    type: Number,
    default: 0, // Lifetime XP
  },
  currentXp: {
    type: Number,
    default: 0, // XP toward next level
  },
  level: {
    type: Number,
    default: 0, // Start at level 0
  },
  cachedRank: {
    type: Number,
    default: null, // Null until calculated
  },
});

// 📌 Index to speed up per-guild ranking and lookups
userXpSchema.index({ guildId: 1, userId: 1 });

module.exports = mongoose.model("UserXP", userXpSchema);
