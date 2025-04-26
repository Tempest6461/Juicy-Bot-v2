const {
  PermissionFlagsBits,
  MessageFlagsBits,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
} = require("discord.js");
const CustomCommands = require("../CustomCommands");

const ITEMS_PER_PAGE = 10; // Number of custom commands to display per page

module.exports = {
  name: "listcustomcmds",
  category: "Utility",
  description: "Lists all custom commands.",

  type: "BOTH",
  guildOnly: true,
  testOnly: false,

  aliases: [ "lcc" ],

  permissions: [PermissionFlagsBits.Administrator],

  callback: async ({ instance, guild, guildId }) => {
    try {
      // Create an instance of your CustomCommands class
      const customCommandsHandler = new CustomCommands(instance.commandHandler);

      // Retrieve custom commands for the current guild using your custom commands handler
      const customCommands = await customCommandsHandler.getAllCommandsForGuild(
        guild.id
      );

      if (customCommands.length === 0) {
        return {
          content: "There are no custom commands in this server.",
          ephemeral: true,
        };
      }

      const commandList = customCommands
        .map((cmd) => {
          const commandName = cmd._id.split("-")[1]; // Split the _id and get the command name
          return `• ${commandName}: ${cmd.response}`;
        })
        .join("\n");

      return {
        content: `Custom Commands:\n${commandList}`,
        ephemeral: true,
      };
    } catch (error) {
      console.error("Error fetching custom commands:", error);
      return {
        content: "An error occurred while fetching custom commands.",
        ephemeral: true,
      };
    }
  },
};
