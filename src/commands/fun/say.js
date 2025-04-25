const { PermissionFlagsBits, MessageFlagsBits } = require("discord.js");
const wordBlacklist = require("../../../command-handler/util/wordBlacklist");

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

  callback: ({ args }) => {
    const message = args.join(" ");
    // console.log({message});
    // console.log({wordBlacklist})

    let foundInText = wordBlacklist.some((blacklistedWord) =>
      message.toLowerCase().includes(blacklistedWord)
    );

    if (message.includes("@everyone") || message.includes("@here")) {
      return {
        flags: MessageFlagsBits.Ephemeral,
        content: "You can't use global pings.",
      };
    } else if (message.includes("@")) {
      return {
        flags: MessageFlagsBits.Ephemeral,
        content: "You cannot mention a user.",
      };
    } else if (foundInText) {
      return {
        flags: MessageFlagsBits.Ephemeral,
        content: "You cannot say that word.",
      };
    } else {
      return {
        content: message,
      };
    }
  },
};
