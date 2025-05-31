// src/commands/utility/aiSettings.js
const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js");
const AISettings = require("../../../command-handler/models/ai-settings-schema");

module.exports = {
  name: "aisettings",
  category: "Utility",
  description:
    "Configure AI random chime settings: list current settings, toggle channels, or set rate (0–100%).",
  expectedArgs: "[#channel] [rate]",
  type: "BOTH",
  testOnly: false,
  guildOnly: true,
  cooldowns: { perUserPerGuild: "1 m" },
  permissions: [PermissionFlagsBits.Administrator],
  options: [
    {
      name: "channel",
      description:
        "Toggle a text channel for random chimes (omit to skip channel update)",
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildText],
      required: false,
    },
    {
      name: "rate",
      description:
        "Set random chime chance per message (0–100; omit to skip rate update)",
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ],

  callback: async ({ guild, interaction, message, args }) => {
    // Defer ephemeral reply for slash commands
    if (interaction) await interaction.deferReply({ ephemeral: true });

    // Parse inputs
    const targetChannel = interaction
      ? interaction.options.getChannel("channel")
      : message.mentions.channels.first() ||
        (args[0] && guild.channels.cache.get(args[0]));

    const rateOption = interaction
      ? interaction.options.getNumber("rate")
      : (() => {
          const r = args.find((a) => !isNaN(a));
          return r != null ? parseFloat(r) : null;
        })();

    const channelProvided = !!targetChannel;
    const rateProvided = rateOption !== null;

    // Fetch existing settings (if any)
    const existing = await AISettings.findOne({ guildId: guild.id });

    // If no args provided, list current settings
    if (!channelProvided && !rateProvided) {
      if (!existing) {
        const none = "No AI chime settings have been configured yet.";
        if (interaction) return interaction.editReply({ content: none });
        else return message.reply(none);
      }

      const rate = existing.chimeRate ?? 0;
      const ids = Array.isArray(existing.chimeChannelIds)
        ? existing.chimeChannelIds
        : [];
      const channelList =
        ids.length > 0
          ? ids
              .map((id) => {
                const ch = guild.channels.cache.get(id);
                return ch ? `<#${id}>` : `\`${id}\``;
              })
              .join(", ")
          : "None";

      const listMsg = [
        "**Current AI Chime Settings:**",
        `• **Rate:** ${rate}%`,
        `• **Allowed Channels:** ${channelList}`,
      ].join("\n");

      if (interaction) return interaction.editReply({ content: listMsg });
      else return message.reply(listMsg);
    }

    // Ensure we have a settings document for updates
    let settings = existing;
    if (!settings) {
      settings = new AISettings({
        guildId: guild.id,
        chimeChannelIds: [],
        chimeRate: 0,
      });
    }

    const responses = [];

    // Handle channel toggle
    if (channelProvided) {
      if (!Array.isArray(settings.chimeChannelIds)) {
        settings.chimeChannelIds = [];
      }
      const id = targetChannel.id;
      if (settings.chimeChannelIds.includes(id)) {
        settings.chimeChannelIds = settings.chimeChannelIds.filter(
          (c) => c !== id
        );
        responses.push(`✅ Removed ${targetChannel} from allowed channels.`);
      } else {
        settings.chimeChannelIds.push(id);
        responses.push(`✅ Added ${targetChannel} to allowed channels.`);
      }
    }

    // Handle rate update
    if (rateProvided) {
      if (rateOption < 0 || rateOption > 100) {
        const err = "❌ Rate must be between 0 and 100.";
        if (interaction) return interaction.editReply({ content: err });
        else return message.reply(err);
      }
      settings.chimeRate = rateOption;
      responses.push(`✅ Chime rate set to **${rateOption}%**.`);
    }

    // Save changes
    try {
      await settings.save();
      const reply = responses.join(" ");
      if (interaction) return interaction.editReply({ content: reply });
      else return message.reply(reply);
    } catch (e) {
      console.error("aisettings save error:", e);
      const errMsg = `⚠️ Error saving settings:\n\`${e.message}\``;
      if (interaction) return interaction.editReply({ content: errMsg });
      else return message.reply(errMsg);
    }
  },
};