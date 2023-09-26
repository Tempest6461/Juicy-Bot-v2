const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "probability",
  category: "Fun",
  description: "Determines the probability of something happening.",

  minArgs: 0,
  maxArgs: 1,
  correctSyntax: "Correct syntax: {PREFIX}probability {ARGS}",

  options: [
    {
      name: "question",
      description: "Ask a question",
      type: 3,
      required: false,
    },
  ],

  type: "BOTH",
  testOnly: false,
  reply: true,
  guildOnly: true,

  permissions: [PermissionFlagsBits.SendMessages],

  callback: ({ message, args }) => {
    const question = args.join(" ");
    const random = Math.floor(Math.random() * 100) + 1;

    if (question) {
      return {
        content: `The probability of ${question} is ${random}%`,
      };
    } else {
      return {
        content: `The probability of something happening is ${random}%`,
      };
    }
  },
};
