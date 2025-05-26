// models/schizo-count-schema.js
const { Schema, model } = require("mongoose");

const schizoCountSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 0
  }
});

module.exports = model("schizo-count", schizoCountSchema);
