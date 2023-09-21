const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    description: "Lists all custom commands",
    
    type: "SLASH",
    guildOnly: true,
    testOnly: false,
  
    permissions: [PermissionFlagsBits.Administrator],
  
    callback: async ({ instance, guild }) => {
      const customCommands = await instance.commandHandler._customCommands.getAll(guild.id);
  
      if (customCommands.length === 0) {
        return {
          content: "There are no custom commands in this server.",
          ephemeral: true,
        };
      }
  
      const commandList = customCommands.map((cmd) => `- ${cmd.name}: ${cmd.description}`).join('\n');
  
      return {
        content: `Custom Commands:\n${commandList}`,
        ephemeral: true,
      };
    },
  };