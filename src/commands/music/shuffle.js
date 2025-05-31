// src/commands/music/shuffle.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'shuffle',
  description: 'Shuffle the upcoming tracks in the queue',
  type: 'SLASH',
  guildOnly: true,

  callback: async ({ client, interaction }) => {
    const guildId = interaction.guildId;
    if (!guildId) {
      return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
    }

    const player = client.magma.players.get(guildId);
    if (!player || (!player.playing && !player.queue.current)) {
      return interaction.reply({ content: '📭 Nothing is playing right now.', ephemeral: true });
    }

    const queue = player.queue;
    const hasTotalSize = typeof queue.totalSize === 'function';
    const numericEntries = () =>
      Object.keys(queue)
        .filter((k) => /^\d+$/.test(k))
        .sort((a, b) => Number(a) - Number(b))
        .map((i) => queue[i]);

    // Determine number of upcoming tracks
    const upcomingCount = hasTotalSize
      ? (await queue.totalSize()) - 1
      : numericEntries().length;

    if (upcomingCount < 2) {
      return interaction.reply({ content: '🔀 Not enough tracks to shuffle.', ephemeral: true });
    }

    // Get upcoming tracks array
    let upcoming;
    if (typeof queue.getSlice === 'function') {
      // slice from index 1 to include all upcoming
      upcoming = await queue.getSlice(1, upcomingCount + 1);
    } else {
      upcoming = numericEntries();
    }

    if (!upcoming.length) {
      return interaction.reply({ content: '🔀 No upcoming tracks to shuffle.', ephemeral: true });
    }

    // Fisher–Yates shuffle
    for (let i = upcoming.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
    }

    // Clear upcoming queue entries
    if (typeof queue.clear === 'function') {
      await queue.clear();
    } else if (typeof queue.dequeue === 'function') {
      // remove until only current remains
      let track;
      do {
        track = await queue.dequeue();
      } while (track != null);
    } else if (typeof queue.remove === 'function') {
      let entries = numericEntries();
      while (entries.length) {
        await queue.remove(1);
        entries = numericEntries();
      }
    }

    // Re-add in shuffled order
    if (typeof queue.add === 'function') {
      await queue.add(upcoming);
    } else {
      for (const track of upcoming) {
        await queue.enqueue(track);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setDescription(`🔀 Queue shuffled! (${upcoming.length} tracks reordered)`);

    return interaction.reply({ embeds: [embed] });
  },
};
