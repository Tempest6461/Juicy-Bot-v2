module.exports = (command) => {
  const { commandObject, commandName } = command;
  const { guildOnly, permissions = [] } = commandObject;

  if (guildOnly !== true && permissions.length) {
    throw new Error(
      `Command "${commandName}" is not a guildOnly command, but permissions are specified.`
    );
  }
};
