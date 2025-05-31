// src/commands/music/resume.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'resume',
  description: 'Resume playback if paused',
  type: 'SLASH',
  guildOnly: true,

  callback: async ({ client, interaction }) => {
    const guildId = interaction.guildId;
    if (!guildId) {
      return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
    }

    const player = client.magma.players.get(guildId);
    if (!player) {
      return interaction.reply({ content: '📭 Nothing is playing right now.', ephemeral: true });
    }

    if (!player.paused) {
      return interaction.reply({ content: '▶️ Playback is not paused.', ephemeral: true });
    }

    // Actually resume
    await player.pause(false);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setDescription('▶️ Playback resumed.');

    return interaction.reply({ embeds: [embed] });
  },
};
