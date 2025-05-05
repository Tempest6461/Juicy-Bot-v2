// src/commands/utility/aiSettings.js
const { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType } = require("discord.js");
const AISettings = require("../../../command-handler/models/ai-settings-schema");

module.exports = {
  name: "aisettings",
  category: "Utility",
  description: "Configure AI settings for random chimes: allowed channels and rate (0-100).",
  expectedArgs: "[channel] [rate]",
  type: "BOTH",
  testOnly: false,
  guildOnly: true,
  cooldowns: {
    perUserPerGuild: "1 m",
  },
  permissions: [PermissionFlagsBits.Administrator],
  options: [
    {
      name: "channel",
      description: "Toggle a text channel for random chimes (omit to skip channel update)",
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildText],
      required: false,
    },
    {
      name: "rate",
      description: "Set chance (0-100) for random chimes per message (omit to skip rate update)",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ],

  callback: async ({ guild, interaction, message, args }) => {
    if (interaction) await interaction.deferReply({ ephemeral: true });

    // Determine targetChannel from options or mentions/args
    let targetChannel;
    if (interaction) {
      targetChannel = interaction.options.getChannel("channel");
    } else {
      targetChannel =
        message.mentions.channels.first() ||
        (args[0] && guild.channels.cache.get(args[0]));
    }

    // Determine rateOption from options or args
    let rateOption;
    if (interaction) {
      rateOption = interaction.options.getNumber("rate");
    } else {
      const rateArg = args.find((a) => !isNaN(a));
      rateOption = rateArg !== undefined ? parseFloat(rateArg) : undefined;
    }

    if (!targetChannel && rateOption === undefined) {
      const usage =
        "❌ Please specify at least a channel to toggle or a rate to set. Usage: `!aisettings [#channel] [rate]`";
      if (interaction) return interaction.editReply({ content: usage });
      else return message.reply(usage);
    }

    // Fetch or create settings
    const settings =
      (await AISettings.findOne({ guildId: guild.id })) ||
      new AISettings({ guildId: guild.id, chimeChannelIds: [], chimeRate: undefined });

    const responses = [];

    // Toggle channel if provided
    if (targetChannel) {
      const chanId = targetChannel.id;
      if (!Array.isArray(settings.chimeChannelIds)) {
        settings.chimeChannelIds = [];
      }
      if (settings.chimeChannelIds.includes(chanId)) {
        settings.chimeChannelIds = settings.chimeChannelIds.filter(
          (id) => id !== chanId
        );
        responses.push(`✅ Removed ${targetChannel} from allowed chime channels.`);
      } else {
        settings.chimeChannelIds.push(chanId);
        responses.push(`✅ Added ${targetChannel} to allowed chime channels.`);
      }
    }

    // Update rate if provided
    if (rateOption !== undefined) {
      if (rateOption < 0 || rateOption > 100) {
        const err = "❌ Rate must be between 0 and 100.";
        if (interaction) return interaction.editReply({ content: err });
        else return message.reply(err);
      }
      settings.chimeRate = rateOption;
      responses.push(`✅ Chime rate set to **${rateOption}%**.`);
    }

    // Save updated settings
    try {
      await settings.save();
      const reply = responses.join(" ");
      if (interaction) return interaction.editReply({ content: reply });
      else return message.reply(reply);
    } catch (error) {
      console.error("aisettings error:", error);
      const errorMsg = `⚠️ Error saving AI settings:\n\`${error.message}\``;
      if (interaction) return interaction.editReply({ content: errorMsg });
      else return message.reply(errorMsg);
    }
  },
};