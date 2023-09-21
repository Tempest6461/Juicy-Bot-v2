const { PermissionFlagsBits } = require("discord.js");
const CustomCommands = require("../CustomCommands");

module.exports = {
  description: "Deletes a custom command or all custom commands in the guild",

  type: "SLASH",
  guildOnly: true,
  testOnly: false,

  permissions: [PermissionFlagsBits.Administrator],

  options: [
    {
      name: "amount",
      description: "Specify the action",
      type: 3,
      required: true,
      choices: [
        {
          name: "Delete All",
          value: "all",
        },
        {
          name: "Delete One",
          value: "one",
        },
      ],
    },
    {
      name: "command_name",
      description: "Specify the name of the command to delete",
      type: 3,
      required: false, // This option is only required when choosing "Delete One"
    },
  ],

  callback: async ({ instance, interaction, guild }) => {
    const { commandHandler } = instance;
    const customCommandsHandler = new CustomCommands(commandHandler);
  
    // Accessing the values correctly
    const action = interaction.options.get("amount").value;
    const commandName = interaction.options.get("command_name")?.value;
  
    if (action === "all") {
      // Delete all custom commands in the guild and get the count
      const deletedCount = await customCommandsHandler.deleteAll(guild.id);
  
      let responseMessage;
      if (deletedCount === 0) {
        responseMessage = "No custom commands found to delete.";
      } else {
        responseMessage = `Deleted ${deletedCount} custom command(s).`;
      }
  
      await interaction.reply({
        content: responseMessage,
        ephemeral: true,
      });
    } else if (action === "one" && commandName) {
      // Delete a single custom command in the guild
      await customCommandsHandler.delete(guild.id, commandName);
  
      await interaction.reply({
        content: `The custom command "${commandName}" has been deleted.`,
        ephemeral: true,
      });
    } else {
      // Invalid or missing command name
      await interaction.reply({
        content: "Invalid or missing command name.",
        ephemeral: true,
      });
    }
  },  
};




