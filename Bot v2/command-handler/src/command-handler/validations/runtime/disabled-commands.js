module.exports = async (command, usage) => {
    const { commandName, instance } = command
    const { guild, message, interaction } = usage
  
    if (!guild) {
      return true
    }
  
    if (
      instance.commandHandler.disabledCommands.isDisabled(guild.id, commandName)
    ) {
      const text = `The command "${commandName}" is disabled in this server.`
  
      if (message) message.reply(text)
      else if (interaction) interaction.reply(text)
  
      return false
    }
  
    return true
  }
  