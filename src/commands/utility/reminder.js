// src/commands/utility/reminder.js
const {
  PermissionFlagsBits,
  MessageFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const Reminder = require("../../../command-handler/models/reminder-schema.js");
const { options } = require("./welcomeSetup.js");

module.exports = {
  name: "reminder",
  category: "Utility",
  description: "Set a reminder for yourself.",

  minArgs: 2,
  expectedArgs: "<Time> <Reminder>",
  correctSyntax:
    "Correct syntax: {PREFIX}reminder <Time (e.g. 1h or 30m or 1h30m)> <Reminder>",

  type: "BOTH",
  testOnly: false,
  guildOnly: true,
  reply: true,

  cooldowns: {
    perUserPerGuild: "1 m",
  },

  options: [
    {
      name: "time",
      description: "Time until the reminder (e.g. 1h, 30m, 1h30m)",
      type: 3,
      required: true,
    },
    {
      name: "reminder",
      description: "The reminder text",
      type: 3,
      required: true,
    },
  ],

  permissions: [PermissionFlagsBits.SendMessages],

  callback: async ({ message, interaction, args, guild, channel, user }) => {
    // Defer immediately if slash
    if (interaction) await interaction.deferReply({ ephemeral: true });

    // 1) Parse & validate input
    const timeArg = args[0];
    const reminderText = args.slice(1).join(" ");
    if (!timeArg || !reminderText) {
      const missing = !timeArg
        ? "Please specify a time."
        : "Please specify a reminder text.";
      const reply = { content: missing };
      if (interaction) reply.flags = MessageFlagsBits.Ephemeral;
      return reply;
    }

    // 2) Convert "1h30m" into milliseconds
    let ms = 0, parts = [];
    const hMatch = timeArg.match(/(\d+)h/);
    const mMatch = timeArg.match(/(\d+)m/);
    if (hMatch) {
      const h = parseInt(hMatch[1], 10);
      if (isNaN(h) || h < 1) {
        const reply = { content: "Invalid hours value (>0)." };
        if (interaction) reply.flags = MessageFlagsBits.Ephemeral;
        return reply;
      }
      ms += h * 3600000;
      parts.push(`${h}h`);
    }
    if (mMatch) {
      const m = parseInt(mMatch[1], 10);
      if (isNaN(m) || m < 1) {
        const reply = { content: "Invalid minutes value (>0)." };
        if (interaction) reply.flags = MessageFlagsBits.Ephemeral;
        return reply;
      }
      ms += m * 60000;
      parts.push(`${m}m`);
    }
    if (parts.length === 0) {
      const reply = {
        content: "Invalid time format. Use e.g. `1h`, `30m`, or `1h30m`.",
      };
      if (interaction) reply.flags = MessageFlagsBits.Ephemeral;
      return reply;
    }

    const displayText = parts.join(" ");
    const remindAt = new Date(Date.now() + ms);

    // 3) Save to MongoDB
    try {
      await Reminder.create({
        userId:    user.id,
        guildId:   guild.id,
        channelId: channel.id,
        remindAt,
        content:   reminderText,
      });
    } catch (err) {
      console.error("❌ reminder DB save failed:", err);
      const reply = {
        content: `Could not save reminder: ${err.message}`,
      };
      if (interaction) reply.flags = MessageFlagsBits.Ephemeral;
      return reply;
    }

    // 4) Schedule the actual reminder
    setTimeout(async () => {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🔔 Reminder")
        .setDescription(reminderText);

      try {
        if (interaction) {
          await interaction.followUp({
            embeds: [embed],
            ephemeral: true,
          });
        } else {
          await message.reply({ embeds: [embed] });
        }
      } catch (err) {
        console.error("❌ reminder follow-up failed:", err);
      }
    }, ms);

    // 5) Immediate confirmation
    const confirm = { content: `Got it! I'll remind you in ${displayText}.` };
    if (interaction) {
      return interaction.editReply(confirm);
    } else {
      return confirm;
    }
  },
};
