const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  description: "Setup the welcoming channel for your server.",

  minArgs: 1,
  expectedArgs: "<channel>",

  type: "SLASH",
  testOnly: false,
  guildOnly: true,

  permissions: [PermissionFlagsBits.Administrator],

  options: [
    {
      name: "channel",
      description: "The channel to use for welcoming new members.",
      type: ApplicationCommandOptionType.Channel,
    },
  ],

  callback: async ({ instance, guild, interaction }) => {
    const channel = interaction.options.getChannel("channel");

    const { welcomeChannels } = instance.commandHandler;

    try {
      await welcomeChannels.add(guild.id, channel.id);
      return `The welcoming channel has been set to ${channel}.`;
    } catch (err) {
      console.log(err);
      return `There was an error setting the welcoming channel. Error: \`${err}\``;
    }
  },
};
