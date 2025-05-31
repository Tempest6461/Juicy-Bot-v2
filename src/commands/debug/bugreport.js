// src/commands/utility/bugreport.js
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "bugreport",
  description: "🐛 Send a bug report to the developer.",
  category: "Utility",
  type: "SLASH",
  guildOnly: true,
  testOnly: false,

  cooldowns: {
    perUserPerGuild: "30 m",
  },

  options: [
    {
      name: "description",
      description: "Describe the bug you encountered",
      type: 3, // STRING
      required: true,
    },
  ],

  callback: async ({ interaction, client }) => {
    const { user, guild, channel } = interaction;
    const description = interaction.options.getString("description");

    // Replace with your Discord user ID or set OWNER_ID in your environment
    const ownerId = process.env.OWNER_ID || "131562657680457729";
    let owner;
    try {
      owner = await client.users.fetch(ownerId);
    } catch {
      return interaction.reply({ content: "⚠️ Developer ID not configured.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("🐛 New Bug Report")
      .addFields(
        { name: "Reporter", value: `${user.tag} (${user.id})` },
        { name: "Server",   value: `${guild?.name || "DM"} (${guild?.id || "-"})` },
        { name: "Channel",  value: `${channel?.name || "DM"} (${channel?.id || "-"})` },
        { name: "Description", value: description }
      )
      .setTimestamp()
      .setColor(0xff0000);

    try {
      await owner.send({ embeds: [embed] });
      await interaction.reply({ content: "✅ Your bug report has been sent to the developer.", ephemeral: true });
    } catch (err) {
      console.error("❌ Failed to send bug report DM:", err);
      await interaction.reply({ content: "❌ Could not send report. Please try again later.", ephemeral: true });
    }
  },
};
