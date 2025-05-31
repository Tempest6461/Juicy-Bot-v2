// src/commands/music/trackhistory.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'trackhistory',
  description: 'Show the recently played tracks (up to 10)',
  type: 'SLASH',
  guildOnly: true,

  callback: async ({ client, interaction }) => {
    const guildId = interaction.guildId;
    if (!guildId) {
      return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
    }

    // Safely access history from MusicHandler
    const historyMap = client.musicHandler?.history;
    const history = historyMap?.get(guildId) || [];
    if (!history.length) {
      return interaction.reply({ content: '📭 No track history available yet.', ephemeral: true });
    }

    // Get last up to 10 tracks, most recent first
    const recent = history.slice(-10).reverse();
    const lines = recent.map((t, i) => `${i + 1}. [${t.title}](${t.uri})`);

    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setTitle('🕘 Recently Played')
      .setDescription(lines.join('\n'));

    return interaction.reply({ embeds: [embed] });
  },
};
