const { ApplicationCommandOptionType, PermissionFlagsBits } = require("discord.js");

module.exports = {
  description: "Setup the welcoming channel for your server.",

  type: "SLASH",
  testOnly: true,
  guildOnly: true,

  permissions: [
    PermissionFlagsBits.Administrator,
  ],

  options: [
    {
      name: "channel",
      description: "The channel to use for welcoming new members.",
      required: true,
      type: ApplicationCommandOptionType.Channel,
    },
  ],

  callback: async ({ instance, guild, interaction }) => {
    const channel = interaction.options.getChannel("channel");

    return `The welcoming channel has been set to ${channel}.`;
  },
};
