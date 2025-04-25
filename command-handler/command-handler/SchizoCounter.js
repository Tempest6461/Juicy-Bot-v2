const NicknameChange = require("../models/nickname-change-schema");

class SchizoCounterHandler {
  async recordNicknameChange(userId, oldNickname, newNickname) {
    try {
      const result = await NicknameChange.create({
        userId,
        oldNickname,
        newNickname
      });
      return result;
    } catch (error) {
      console.error("Error recording nickname change:", error);
      return null;
    }
  }

  async getNicknameChangeCount(userId) {
    try {
      const count = await NicknameChange.countDocuments({ userId });
      return count;
    } catch (error) {
      console.error("Error getting nickname change count:", error);
      return 0;
    }
  }

  async removeNicknameCounter(userId) {
    try {
      const result = await NicknameChange.deleteMany({ userId });
      return result;
    } catch (error) {
      console.error("Error removing nickname counter:", error);
      return null;
    }
  }
}

module.exports = SchizoCounterHandler;
