const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    description: "Lists all custom commands",
    
    type: "SLASH",
    guildOnly: true,
    testOnly: false,
  
    permissions: [PermissionFlagsBits.Administrator],
  
    callback: async ({ instance, guild }) => {
      const customCommands = await instance.commandHandler.customCommands.get(guild.id);
  
      if (!customCommands || !customCommands.length) {
        return {
          content: "There are no custom commands in this server",
          ephemeral: true,
        };
      }

      const commands = customCommands.map((command) => {
        return `\`${command.commandName}\` - ${command.description}`;
      });

      return {
        content: commands.join("\n"),
        ephemeral: true,
      };
    },
  };