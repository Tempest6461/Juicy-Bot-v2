const {
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");
const UserXP = require("../../../command-handler/models/user-xp-schema");

module.exports = {
  name: "wipexp",
  description: "DEBUG: Wipe ALL user XP and levels in the server.",
  category: "Debug",
  type: "SLASH",
  guildOnly: true,
  testOnly: false,
  permissions: [PermissionFlagsBits.Administrator],

  callback: async ({ interaction }) => {
    const guildId = interaction.guild.id;

    const confirmButton = new ButtonBuilder()
      .setCustomId("confirm-wipexp")
      .setLabel("Yes, wipe all XP")
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel-wipexp")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    const embed = new EmbedBuilder()
      .setTitle("⚠️ Global XP Wipe")
      .setDescription(
        "**Are you absolutely sure you want to wipe all XP and levels from every user in this server?**\n\nThis cannot be undone.\n\n⏳ You have 30 seconds to confirm or cancel."
      )
      .setColor("Red");

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 30_000,
    });

    let wasHandled = false;

    collector.on("collect", async (i) => {
      wasHandled = true;

      if (i.customId === "cancel-wipexp") {
        try {
          const cancelEmbed = new EmbedBuilder()
            .setTitle("❌ XP Wipe Cancelled")
            .setColor("Grey");

          await interaction.editReply({
            embeds: [cancelEmbed],
            components: [],
          });
        } catch (err) {
          console.warn("Cancel edit failed:", err.message);
        }
        collector.stop();
      }

      if (i.customId === "confirm-wipexp") {
        try {
          await UserXP.updateMany({ guildId }, {
            $set: {
              xp: 0,
              currentXp: 0,
              level: 0,
              cachedRank: null,
            }
          });
        } catch (err) {
          console.error("DB wipe error:", err);
          const failEmbed = new EmbedBuilder()
            .setTitle("❌ Failed to wipe XP")
            .setDescription("Check logs or database connection.")
            .setColor("DarkRed");

          await interaction.editReply({
            embeds: [failEmbed],
            components: [],
          });
          return collector.stop();
        }

        const successEmbed = new EmbedBuilder()
          .setTitle("✅ XP Wiped")
          .setDescription("All user XP and levels have been reset for this server.")
          .setColor("Green");

        try {
          await interaction.editReply({
            embeds: [successEmbed],
            components: [],
          });
        } catch (err) {
          console.warn("Confirm edit failed:", err.message);
        }

        collector.stop();
      }
    });

    collector.on("end", async () => {
      if (!wasHandled) {
        const timeoutEmbed = new EmbedBuilder()
          .setTitle("⌛ XP Wipe Timed Out")
          .setDescription("No action was taken within 30 seconds.")
          .setColor("Orange");

        try {
          await interaction.editReply({
            embeds: [timeoutEmbed],
            components: [],
          });
        } catch (err) {
          console.warn("Timeout edit failed:", err.message);
        }
      }
    });
  },
};
