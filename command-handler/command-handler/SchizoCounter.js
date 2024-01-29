const NicknameChange = require("../models/schizo-counter-schema");

class SchizoCounterHandler {
  _schizoCounter = new Map();

  async recordNicknameChange(userId, oldNickname, newNickname) {
    const changeData = {
      userId,
      oldNickname,
      newNickname,
    };

    try {
      const result = await NicknameChange.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          _id: userId,
          $push: { changes: changeData },
        },
        {
          upsert: true,
          new: true,
        }
      );
      this._schizoCounter.set(userId, result);
      return result;
    } catch (error) {
      console.error("Error recording nickname change:", error);
      return null;
    }
  }

  async removeNicknameCounter(userId) {
    try {
      const result = await NicknameChange.findOneAndDelete({ _id: userId });
      this._schizoCounter.delete(userId);
      return result;
    } catch (error) {
      console.error("Error removing nickname counter:", error);
      return null;
    }
  }

  async getNicknameCounter(userId) {
    let counter = this._schizoCounter.get(userId);

    if (!counter) {
      try {
        const result = await NicknameChange.findById(userId);
        counter = result ? result : null;
        this._schizoCounter.set(userId, counter);
        console.log("Retrieved Document - getNicknameCounter:", result);
      } catch (error) {
        console.error("Error retrieving nickname counter:", error);
        return null;
      }
    }
    return counter;
  }

  async getNicknameChangeCount(userId) {
    try {
      // Retrieve the document from the database based on the user ID
      const result = await NicknameChange.findById(userId);

      // Access the 'changes' array and calculate its length
      const changesArray = result.changes || [];
      const numberOfChanges = changesArray.length;

      // Return the number of changes
      return numberOfChanges;
    } catch (error) {
      console.error("Error retrieving nickname counter:", error);
      return 0;
    }
  }
}

module.exports = SchizoCounterHandler;
