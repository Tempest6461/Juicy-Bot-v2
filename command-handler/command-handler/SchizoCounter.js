// command-handler/command-handler/SchizoCounter.js
const SchizoCount = require("../models/schizo-count-schema");

class SchizoCounterHandler {
  async incrementNicknameChange(userId) {
    try {
      const result = await SchizoCount.findOneAndUpdate(
        { userId },
        { $inc: { count: 1 } },
        { new: true, upsert: true }
      );
      return result.count;
    } catch (error) {
      console.error("Error incrementing schizo counter:", error);
      return 0;
    }
  }

  async getNicknameChangeCount(userId) {
    try {
      const entry = await SchizoCount.findOne({ userId });
      return entry ? entry.count : 0;
    } catch (error) {
      console.error("Error getting schizo counter:", error);
      return 0;
    }
  }

  async resetNicknameCounter(userId) {
    try {
      const result = await SchizoCount.findOneAndUpdate(
        { userId },
        { count: 0 },
        { new: true }
      );
      return result;
    } catch (error) {
      console.error("Error resetting schizo counter:", error);
      return null;
    }
  }
}

module.exports = SchizoCounterHandler;
