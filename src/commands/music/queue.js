// src/commands/music/queue.js
const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'queue',
  description: 'View, remove, or clear the music queue',
  type: 'SLASH',
  guildOnly: true,
  options: [
    {
      name: 'action',
      description: 'What to do with the queue',
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: 'view',   value: 'view'   },
        { name: 'remove', value: 'remove' },
        { name: 'clear',  value: 'clear'  },
      ],
    },
    {
      name: 'position',
      description: 'Position of track to remove (1 = next up, etc.)',
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
  ],

  callback: async ({ client, interaction }) => {
    const guildId = interaction.guildId;
    if (!guildId) {
      return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
    }

    const player = client.magma.players.get(guildId);
    if (!player) {
      return interaction.reply({ content: '📭 Nothing is queued right now.', ephemeral: true });
    }

    const q = player.queue;
    const action = interaction.options.getString('action') || 'view';
    const pos = interaction.options.getInteger('position');

    // Helper: extract numeric queue entries
    const numericEntries = () =>
      Object.keys(q)
        .filter(k => /^\d+$/.test(k))
        .sort((a, b) => Number(a) - Number(b))
        .map(i => q[i]);

    const hasGetSlice  = typeof q.getSlice === 'function';
    const hasTotalSize = typeof q.totalSize === 'function';

    // ─── CLEAR ─────────────────────────────────────────────────────────────
    if (action === 'clear') {
      if (typeof q.clear === 'function') {
        // Magmastream’s built-in clear
        await q.clear();
      } else if (typeof q.dequeue === 'function') {
        // Repeatedly dequeue until only the current track remains
        let next;
        do {
          next = await q.dequeue();
        } while (next != null);
      } else if (typeof q.remove === 'function') {
        // Fallback: remove by position one-by-one
        let entries = numericEntries();
        while (entries.length) {
          await q.remove(1);
          entries = numericEntries();
        }
      }
      return interaction.reply({ content: '🗑️ Queue cleared.', ephemeral: true });
    }

    // ─── REMOVE ───────────────────────────────────────────────────────────
    if (action === 'remove') {
      const entries = numericEntries();
      const upTotal = entries.length;
      if (!pos || pos < 1 || pos > upTotal) {
        return interaction.reply({ content: '❌ Invalid position.', ephemeral: true });
      }

      let removed;
      if (typeof q.remove === 'function') {
        [removed] = await q.remove(pos);
      } else {
        removed = entries[pos - 1];
        delete q[pos];
      }
      return interaction.reply({ content: `🗑️ Removed **${removed.title}** from slot ${pos}.` });
    }

    // ─── VIEW ───────────────────────────────────────────────────────────────
    const now = q.current || null;
    let upcoming = [];
    if (hasGetSlice) {
      upcoming = await q.getSlice(1, 11);
    } else {
      upcoming = numericEntries().slice(0, 10);
    }
    const upCount = hasTotalSize
      ? (await q.totalSize()) - 1
      : numericEntries().length;

    // format ms → M:SS
    const formatDuration = (ms) => {
      if (ms == null) return 'Live';
      const totalSec = Math.floor(ms / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return `${m}:${String(s).padStart(2, '0')}`;
    };

    const nowField = now
      ? `▶️ **${now.title}** (\`${formatDuration(now.duration)}\`)`
      : 'Nothing is playing right now.';

    const upLines = upcoming.map((t, i) => {
      const dur = t.duration ? formatDuration(t.duration) : 'Live';
      return `${i + 1}. **${t.title}** (\`${dur}\`)`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setTitle(`🎶 Queue — ${upCount} upcoming track${upCount === 1 ? '' : 's'}`)
      .addFields(
        { name: 'Now Playing', value: nowField },
        { name: 'Up Next',     value: upLines.length ? upLines.join('\n') : 'No upcoming tracks.' }
      );

    return interaction.reply({ embeds: [embed] });
  },
};
