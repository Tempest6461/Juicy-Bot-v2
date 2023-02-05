const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  category: "Testing",
  description: "Simulates a user joining the server.",

  correctSyntax: "Correct syntax: {PREFIX}simjoin",

  type: "BOTH",
  reply: true,
  testOnly: false,
  guildOnly: true,

  cooldowns: {
    perUserPerGuild: "5 m",
  },

  permissions: [PermissionFlagsBits.Administrator],

  callback: ({ client, interaction, message }) => {
    try {
      client.emit("guildMemberAdd", interaction.member);
    } catch (err) {
      client.emit("guildMemberAdd", message.member);
    }
    return {
      ephemeral: true,
      content: `Simulated a user joining the server.`,
    };
  },
};
