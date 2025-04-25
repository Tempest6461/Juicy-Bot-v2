// src/util/openai.js (CommonJS)
require("dotenv").config();
const OpenAI = require("openai");

// Instantiate the OpenAI client directly for CommonJS usage
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = openai;
