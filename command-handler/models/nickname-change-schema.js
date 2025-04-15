// models/nickname-change-schema.js
const { Schema, model } = require("mongoose");

const nicknameChangeSchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  oldNickname: String,
  newNickname: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: { expires: '24h' }
  }
});

module.exports = model("nickname-change", nicknameChangeSchema);
