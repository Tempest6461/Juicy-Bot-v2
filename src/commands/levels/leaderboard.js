const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const UserXP = require("../../../command-handler/models/user-xp-schema");

module.exports = {
  name: "leaderboard",
  description: "View the XP leaderboard with pagination",
  category: "Levels",
  type: "SLASH",
  guildOnly: true,

  callback: async ({ interaction }) => {
    const guildId = interaction.guild.id;
    const user = interaction.user;

    const allUsers = await UserXP.find({ guildId }).sort({ level: -1, xp: -1 });
    if (!allUsers.length) {
      return interaction.reply({
        content: "No one has earned XP yet!",
        ephemeral: true,
      });
    }

    const usersPerPage = 10;
    const totalPages = Math.ceil(allUsers.length / usersPerPage);

    const createEmbed = async (page) => {
      const start = page * usersPerPage;
      const end = start + usersPerPage;
      const entries = allUsers.slice(start, end);

      const lines = await Promise.all(
        entries.map(async (entry, index) => {
          const member = await interaction.guild.members
            .fetch(entry.userId)
            .catch(() => null);
          const tag = member?.user?.tag || `Unknown User`;
          const rank = start + index + 1;
          return `**${rank}.** ${tag} — Level ${entry.level}, ${entry.xp} XP`;
        })
      );

      return new EmbedBuilder()
        .setTitle(`🏆 XP Leaderboard (Page ${page + 1}/${totalPages})`)
        .setDescription(lines.join("\n"))
        .setColor("Gold");
    };

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("leaderboard-page")
      .setPlaceholder("📜 Select a page")
      .addOptions(
        Array.from({ length: totalPages }, (_, i) => ({
          label: `Page ${i + 1}`,
          value: i.toString(),
          description: `Ranks ${i * usersPerPage + 1}–${Math.min(
            (i + 1) * usersPerPage,
            allUsers.length
          )}`,
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const initialEmbed = await createEmbed(0);

    await interaction.reply({
      embeds: [initialEmbed],
      components: [row],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: (i) => i.customId === "leaderboard-page" && i.user.id === user.id,
      time: 120_000,
      idle: 60_000,
    });

    collector.on("collect", async (i) => {
      const page = parseInt(i.values[0]);
      const embed = await createEmbed(page);
      await i.update({ embeds: [embed], components: [row] });
    });

    collector.on("end", async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch {}
    });
  },
};
