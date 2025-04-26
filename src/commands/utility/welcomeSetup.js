// src/commands/welcomeSetup.js
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
  cooldowns: {
    perUserPerGuild: "1 m",
  },

  permissions: [PermissionFlagsBits.Administrator],

  options: [
    {
      name: "channel",
      description: "The channel to use for welcoming new members.",
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
  ],

  callback: async ({ instance, guild, interaction }) => {
    // Acknowledge the interaction to avoid the "application did not respond" error
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.options.getChannel("channel");
    const { welcomeChannels } = instance.commandHandler;

    try {
      // Save the welcome channel
      await welcomeChannels.add(guild.id, channel.id);
      // Confirm success
      await interaction.editReply({
        content: `✅ The welcoming channel has been set to ${channel}.`,
      });
    } catch (err) {
      console.error("welcomeSetup error:", err);
      // Inform user of failure
      await interaction.editReply({
        content: `⚠️ There was an error setting the welcoming channel.\n\`${err}\``,
      });
    }
  },
};
