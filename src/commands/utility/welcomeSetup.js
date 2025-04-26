// src/commands/utility/welcomeSetup.js
const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "welcomesetup",
  category: "Utility",
  description: "Setup the welcoming channel for your server!",

  expectedArgs: "<channel>",
  type: "BOTH",            // now handles both slash & prefix
  testOnly: true,
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

  callback: async ({ instance, guild, interaction, message, args }) => {
    const welcomeChannels = instance.commandHandler.welcomeChannels;

    // If this is a slash invocation, acknowledge it
    if (interaction) {
      await interaction.deferReply({ ephemeral: true });
    }

    // Resolve the channel argument
    let channel;
    if (interaction) {
      channel = interaction.options.getChannel("channel");
    } else {
      // Legacy: look for a mentioned channel or ID in args[0]
      channel =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(args[0]);
    }

    if (!channel) {
      const errText =
        "You need to specify a channel for welcoming new members.";
      if (interaction) {
        return interaction.editReply({ content: errText });
      } else {
        return message.reply(errText);
      }
    }

    try {
      // Save the welcome channel
      await welcomeChannels.add(guild.id, channel.id);

      const successText = `✅ The welcoming channel has been set to ${channel}.`;

      if (interaction) {
        await interaction.editReply({ content: successText });
      } else {
        await message.reply(successText);
      }
    } catch (err) {
      console.error("welcomeSetup error:", err);
      const errorText = `⚠️ There was an error setting the welcoming channel.\n\`${err.message || err}\``;

      if (interaction) {
        await interaction.editReply({ content: errorText });
      } else {
        await message.reply(errorText);
      }
    }
  },
};
