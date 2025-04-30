// src/commands/music/queue.js
const { ApplicationCommandOptionType } = require('discord.js');
const music = require('../../../command-handler/command-handler/MusicHandler.js');

module.exports = {
  name: 'queue',
  category: 'Music',
  description: 'View or modify the music queue.',
  type: 'BOTH',
  guildOnly: true,
  options: [
    {
      name: 'view',
      description: 'View the current queue',
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: 'add',
      description: 'Add a track to the queue',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'query',
          description: 'YouTube URL or search keywords',
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ]
    },
    {
      name: 'remove',
      description: 'Remove a track from the queue by position',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'position',
          description: '1-based queue index to remove',
          type: ApplicationCommandOptionType.Integer,
          required: true
        }
      ]
    },
    {
      name: 'clear',
      description: 'Clear the entire queue',
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: 'reposition',
      description: 'Move a track to a new position',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'from',
          description: 'Current track position (1-based)',
          type: ApplicationCommandOptionType.Integer,
          required: true
        },
        {
          name: 'to',
          description: 'New position for the track (1-based)',
          type: ApplicationCommandOptionType.Integer,
          required: true
        }
      ]
    }
  ],

  callback: async ({ interaction, message, args }) => {
    const isSlash = Boolean(interaction);
    const guild   = isSlash ? interaction.guild : message.guild;
    const member  = isSlash ? interaction.member : message.member;
    const sub     = isSlash
      ? interaction.options.getSubcommand()
      : (args[0] || 'view').toLowerCase();
    const reply = isSlash ? interaction : message;

    try {
      switch (sub) {
        case 'view': {
          const q = music.getQueue(guild.id);
          const content = !q.length
            ? '📭 Queue is empty.'
            : `📜 Queue:\n${q.map((t,i) => `${i+1}. ${t}`).join('\n')}`;
          return isSlash
            ? reply.reply({ content, ephemeral: false })
            : reply.reply(content);
        }

        case 'add': {
          const vc = member.voice.channel;
          if (!vc) throw new Error('🔈 You need to join a voice channel first.');
          const query = isSlash
            ? interaction.options.getString('query')
            : args.slice(1).join(' ');
          const title = await music.enqueue(guild, vc, query);
          const msg = `▶️ Enqueued **${title}**`;
          return isSlash
            ? reply.reply(msg)
            : reply.reply(msg);
        }

        case 'remove': {
          const pos = isSlash
            ? interaction.options.getInteger('position')
            : parseInt(args[1], 10);
          if (isNaN(pos) || pos < 1) throw new Error('❌ Please provide a valid track position.');
          const removed = music.remove(guild.id, pos);
          const msg = `🗑️ Removed **${removed}** from the queue.`;
          return isSlash
            ? reply.reply(msg)
            : reply.reply(msg);
        }

        case 'clear': {
          music.clearQueue(guild.id);
          const msg = '🗑️ Queue cleared.';
          return isSlash
            ? reply.reply(msg)
            : reply.reply(msg);
        }

        case 'reposition': {
          const from = isSlash
            ? interaction.options.getInteger('from')
            : parseInt(args[1], 10);
          const to = isSlash
            ? interaction.options.getInteger('to')
            : parseInt(args[2], 10);
          if (
            isNaN(from) ||
            isNaN(to) ||
            from < 1 ||
            to < 1
          ) throw new Error('❌ Please provide valid track positions.');
          music.moveTrack(guild.id, from, to);
          const msg = `🔀 Moved track from position **${from}** to **${to}**.`;
          return isSlash
            ? reply.reply(msg)
            : reply.reply(msg);
        }

        default:
          throw new Error('❌ That subcommand does not exist.');
      }
    } catch (err) {
      const errMsg = err.message || 'An error occurred.';
      return isSlash
        ? reply.reply({ content: errMsg, ephemeral: true })
        : reply.reply(errMsg);
    }
  }
};
