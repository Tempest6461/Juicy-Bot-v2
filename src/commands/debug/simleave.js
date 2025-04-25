const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  category: "Testing",
  description: "Simulates a user leaving the server.",

  correctSyntax: "Correct syntax: {PREFIX}simleave",

  type: "BOTH",
  reply: true,
  testOnly: false,
  guildOnly: true,

  cooldowns: {
    perUserPerGuild: "10 s",
  },

  permissions: [PermissionFlagsBits.Administrator],

  callback: ({ client, interaction, message }) => {
    try {
      client.emit("guildMemberRemove", interaction.member);
    } catch (err) {
      console.log(err);
      client.emit("guildMemberRemove", message.member);
    }

    return {
      ephemeral: true,
      content: `Simulated a user leaving the server.`,
    };
  },
};
