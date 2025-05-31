// src/commands/utility/changelog.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} = require("discord.js");
const fs   = require("fs");
const path = require("path");

module.exports = {
  name: "changelog",
  description: "Browse the changelog.",
  type: "SLASH",
  guildOnly: false,

  callback: async ({ interaction }) => {
    await interaction.deferReply();

    const changelogPath = path.join(process.cwd(), "changelog.json");
    let entries;
    try {
      const raw = fs.readFileSync(changelogPath, "utf8");
      entries = JSON.parse(raw);
      if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error("No entries found");
      }
    } catch (err) {
      console.error("Failed to load changelog.json:", err);
      return interaction.editReply({
        content: `❌ Could not load changelog: ${err.message}`,
      });
    }

    // Take up to the last 10 entries
    const lastEntries = entries.slice(-10);
    const latestIndex = entries.length - 1;

    // Build select options
    const options = lastEntries.map((entry, i) => {
      const idx = entries.length - lastEntries.length + i;
      return {
        label:       `v${entry.version}`,
        description: entry.date,
        value:       idx.toString(),
      };
    });

    // Embed factory
    const makeEmbed = (entry) =>
      new EmbedBuilder()
        .setTitle(`Changelog • v${entry.version} (${entry.date})`)
        .setDescription(entry.changes.map(line => `• ${line}`).join("\n"))
        .setTimestamp(new Date(entry.date));

    // Dropdown with custom placeholder
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("changelog-menu")
        .setPlaceholder("📜 Browse versions…")
        .addOptions(options)
    );

    // Send initial reply showing the most recent entry
    await interaction.editReply({
      embeds:     [makeEmbed(entries[latestIndex])],
      components: [row],
    });
    const msg = await interaction.fetchReply();

    // Collector for 5 minutes
    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) =>
        i.customId === "changelog-menu" &&
        i.user.id === interaction.user.id,
      time: 5 * 60 * 1000,
    });

    collector.on("collect", async (i) => {
      const idx = parseInt(i.values[0], 10);
      const entry = entries[idx];
      if (!entry) return;
      await i.update({ embeds: [makeEmbed(entry)], components: [row] });
    });

    collector.on("end", async () => {
      try { await msg.edit({ components: [] }); }
      catch {}
    });
  },
};
