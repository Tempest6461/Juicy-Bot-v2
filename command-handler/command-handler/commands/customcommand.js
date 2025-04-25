const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "customcommand",
  category: "Utility",
  description: "Creates a custom command",

  minArgs: 3,
  syntaxError: "Correct syntax: {PREFIX}customCommand {ARGS}",
  expectedArgs: "<command name> <description> <response>",

  type: "BOTH",
  guildOnly: true,
  testOnly: false,

  aliases: [ "cc" ],

  permissions: [PermissionFlagsBits.Administrator],

  callback: async ({ instance, args, guild }) => {
    let [commandName, description, response] = args;

    commandName = commandName.toLowerCase().replace(/\s+/g, "");

    await instance.commandHandler.customCommands.create(
      guild.id,
      commandName,
      description,
      response
    );

    return {
      content: `Custom command "${commandName}" has been created!`,
      flags: MessageFlagsBits.Ephemeral,
    };
  },
};
