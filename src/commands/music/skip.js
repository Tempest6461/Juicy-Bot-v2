// src/commands/music/skip.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'skip',
  description: 'Skip the current track',
  type: 'SLASH',
  guildOnly: true,

  callback: async ({ client, interaction }) => {
    const guildId = interaction.guildId;
    if (!guildId) {
      return interaction.reply({ content: '❌ This must be used in a server.', ephemeral: true });
    }

    const player = client.magma.players.get(guildId);
    if (!player) {
      return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
    }

    const q = player.queue;
    const current = q.current;
    if (!current) {
      return interaction.reply({ content: '❌ Nothing to skip.', ephemeral: true });
    }

    // Dequeue next track from queue
    let next;
    if (typeof q.dequeue === 'function') {
      next = await q.dequeue();
    } else {
      // fallback: numeric entries
      const entries = Object.keys(q)
        .filter(k => /^\d+$/.test(k))
        .sort((a, b) => Number(a) - Number(b))
        .map(i => q[i]);
      next = entries.shift();
      // reassign numeric slots
      entries.forEach((track, i) => { q[i] = track; });
      delete q[entries.length];
    }

    // Set current to next or null
    if (typeof q.setCurrent === 'function') {
      await q.setCurrent(next || null);
    } else {
      q.current = next || null;
    }

    if (next) {
      // Play the next track
      await player.play();
      const embed = new EmbedBuilder()
        .setColor(0x1db954)
        .setTitle('⏭️ Skipped')
        .setDescription(`Skipped **${current.title}**\nNow playing **${next.title}**`);
      return interaction.reply({ embeds: [embed] });
    } else {
      // No more tracks
      await player.stop();
      return interaction.reply('⏹ Stopped playback, queue is empty.');
    }
  },
};
