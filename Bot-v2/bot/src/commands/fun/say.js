const { PermissionFlagsBits } = require("discord.js");
const {
  wordBlacklist,
} = require("../../../../command-handler/src/util/wordBlacklist");

module.exports = {
  name: "say",
  category: "Misc",
  description: "Make the bot say something!",

  minArgs: 1,
  maxArgs: 2,
  correctSyntax: "Correct syntax: {PREFIX}say {ARGS}",
  expectedArgs: "<message>",

  type: "BOTH",
  testOnly: false,
  reply: true,
  guildOnly: true,

  permissions: [PermissionFlagsBits.SendMessages],

  callback: ({ args, wordBlacklist }) => {
    const message = args.join(" ");

    let foundInText = (wordBlacklist) =>
      message.content.toLowerCase().includes(wordBlacklist);

    if (message.includes("@everyone") || message.includes("@here")) {
      return {
        ephemeral: true,
        content: "You cannot mention everyone or here.",
      };
    } else if (message.includes("@")) {
      return {
        ephemeral: true,
        content: "You cannot mention a user.",
      };
    } else if (foundInText) {
      return {
        ephemeral: true,
        content: "You cannot say that word.",
      };
    } else {
      return {
        content: message,
      };
    }
  },
};
