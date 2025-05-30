// src/commands/music/pause.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'pause',
  description: 'Pause the current track',
  type: 'SLASH',
  guildOnly: true,

  callback: async ({ client, interaction }) => {
    const guildId = interaction.guildId;
    if (!guildId) {
      return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
    }

    const player = client.magma.players.get(guildId);
    // Ensure there's something playing
    const hasCurrent = typeof player?.queue.getCurrent === 'function'
      ? await player.queue.getCurrent()
      : player?.queue.current;
    if (!player || (!player.playing && !hasCurrent)) {
      return interaction.reply({ content: '📭 Nothing is playing right now.', ephemeral: true });
    }

    if (player.paused) {
      return interaction.reply({ content: '⏸️ Playback is already paused.', ephemeral: true });
    }

    // Pause playback
    await player.pause(true);

    const embed = new EmbedBuilder()
      .setColor(0xffff00)
      .setDescription('⏸️ Playback paused.');

    return interaction.reply({ embeds: [embed] });
  },
};
