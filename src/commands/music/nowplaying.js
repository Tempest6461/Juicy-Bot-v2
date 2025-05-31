const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show info about the currently playing track'),

  async callback({ client, interaction }) {
    const guildId = interaction.guildId;
    if (!guildId) {
      return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
    }

    const player = client.magma.players.get(guildId);
    if (!player || (!player.playing && !player.queue.current && typeof player.queue.getCurrent !== 'function')) {
      return interaction.reply({ content: '📭 Nothing is playing right now.', ephemeral: true });
    }

    // Fetch current track in a way compatible with Magmastream's queue
    let current;
    if (typeof player.queue.getCurrent === 'function') {
      current = await player.queue.getCurrent();
    } else {
      current = player.queue.current || null;
    }
    if (!current) {
      return interaction.reply({ content: '📭 Nothing is playing right now.', ephemeral: true });
    }

    // Track position and duration
    const position = typeof player.position === 'number' ? player.position : 0;
    const duration = current.duration;

    // Helper: format milliseconds to M:SS
    const formatDuration = ms => {
      if (ms == null) return 'Live';
      const totalSec = Math.floor(ms / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return `${m}:${String(s).padStart(2, '0')}`;
    };

    // Build a simple text progress bar
    const totalBlocks = 12;
    const progressRatio = duration ? position / duration : 0;
    const filledBlocks = Math.round(progressRatio * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    const bar = '▇'.repeat(filledBlocks) + '—'.repeat(emptyBlocks);

    // Determine who requested the track
    const requester = current.requester?.tag || current.requestedBy?.tag || 'Unknown';

    // Fetch the next track (if any)
    let nextTracks;
    if (typeof player.queue.getSlice === 'function') {
      nextTracks = await player.queue.getSlice(1, 2);
    } else {
      // Fallback: numeric queue entries
      const entries = Object.keys(player.queue)
        .filter(k => /^\d+$/.test(k))
        .sort((a, b) => Number(a) - Number(b))
        .map(i => player.queue[i]);
      nextTracks = entries.slice(0, 1);
    }
    const next = nextTracks.length ? nextTracks[0] : null;
    const nextText = next
      ? `▶️ **${next.title}** (\`${formatDuration(next.duration)}\`)`
      : 'None';

    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setTitle('▶️ Now Playing')
      .setDescription(`**[${current.title}](${current.uri})**`)
      .addFields(
        { name: 'Progress', value: `${bar} ${formatDuration(position)} / ${formatDuration(duration)}` },
        { name: 'Requested by', value: requester, inline: true },
        { name: 'Up Next', value: nextText, inline: true }
      );

    return interaction.reply({ embeds: [embed] });
  },
};
