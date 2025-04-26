const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "welcomesetup",
  category: "Utility",
  description: "Setup the welcoming channel for your server.",

  expectedArgs: "<channel>",

  type: "SLASH",
  testOnly: false,
  guildOnly: true,
  delete: true,
  cooldowns: {
    perUserPerGuild: "1 m",
  },

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

    if (!channel) {
      return {
        content: "You need to specify a channel for welcoming new members.",
        flags: MessageFlagsBits.Ephemeral,
      };
    }

    const { welcomeChannels } = instance.commandHandler;

    try {
      await welcomeChannels.add(guild.id, channel.id);
      return {
        content: `The welcoming channel has been set to ${channel}.`,
        flags: MessageFlagsBits.Ephemeral,
      };
    } catch (err) {
      return {
        content: `There was an error setting the welcoming channel. Error: \`${err}\``,
        flags: MessageFlagsBits.Ephemeral,
      };
    }
  },
};
