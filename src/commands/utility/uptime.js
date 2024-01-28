const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "uptime",
  category: "Utility",
  description: "Check the uptime of the bot.",

  minArgs: 0,
  maxArgs: 0,
  expectedArgs: "",
  correctSyntax: "Correct syntax: {PREFIX}uptime",

  type: "BOTH",
  testOnly: false,
  guildOnly: true,
  reply: true,

  cooldowns: {
    perUserPerGuild: "1 m",
  },

  permissions: [PermissionFlagsBits.SendMessages],

  callback: ({ message, client }) => {
    let totalSeconds = client.uptime / 1000;
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);

    let uptime = `${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds`;

    message.reply(`My uptime is ${uptime}`);
  },
};
