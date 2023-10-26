const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "prefix",
  category: "Utility",
  description: "Set the prefix for the server.",

  minArgs: 1,
  syntaxError: "Incorrect syntax! Use {PREFIX}prefix {ARGS}",
  expectedArgs: "<prefix>",

  type: "BOTH",
  testOnly: false,
  guildOnly: true,

  permissions: [PermissionFlagsBits.Administrator],

  callback: ({ instance, guild, text: prefix }) => {
    instance.commandHandler.prefixHandler.set(guild.id, prefix);

    return `Set "${prefix}" as the prefix for this server.`;
  },
};
