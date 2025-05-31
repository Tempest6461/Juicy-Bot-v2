// src/commands/music/play.js
const { LoadTypes, StateTypes } = require('magmastream');
const { SlashCommandBuilder }    = require('discord.js');
const ytpl                       = require('ytpl');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or playlist')
    .addStringOption(opt =>
      opt
        .setName('query')
        .setDescription('Song name, URL, or playlist URL')
        .setRequired(true)
    ),

  async callback({ client, interaction }) {
    const member = interaction.member;
    const vc     = member.voice.channel;
    if (!vc) {
      return interaction.reply({ content: '🔈 Join a voice channel first!', ephemeral: true });
    }

    await interaction.deferReply();

    // --- ensure player exists & is connected ---
    let player = client.magma.players.get(interaction.guildId);
    if (!player) {
      player = client.magma.create({
        guildId:        interaction.guildId,
        voiceChannelId: vc.id,
        textChannelId:  interaction.channelId,
        selfDeafen:     true,
        volume:         100,
      });
    }
    if (player.state !== StateTypes.Connected) {
      await player.connect();
    }

    // --- handle query ---
    const query = interaction.options.getString('query');

    // helper to grab now playing in a way that works for both RedisQueue and Magmastream's built-in Queue
    const getNow = async () => {
      const q = player.queue;
      if (typeof q.getCurrent === 'function') {
        return await q.getCurrent();
      } else {
        return q.current || null;
      }
    };

    // 1) Raw YouTube playlist via ytpl
    if (/(\?|&)list=/.test(query)) {
      let pl;
      try {
        pl = await ytpl(query, { limit: Infinity });
      } catch {
        return interaction.editReply('❌ Failed to load playlist.');
      }

      for (const item of pl.items) {
        const res = await client.magma.search(item.shortUrl, member.user);
        if (res.loadType === LoadTypes.Track) {
          player.queue.add(res.tracks[0]);
        }
      }

      if (!player.playing && !player.paused) {
        await player.play();
      }

      const now = await getNow();
      return interaction.editReply(
        `✅ Playlist queued: **${pl.title}** — ${pl.items.length} tracks\n\n` +
        `**Now Playing:**\n▶️ **${now?.author} — ${now?.title}**`
      );
    }

    // 2) Regular search/track/playlist from Lava
    const res = await client.magma.search(query, member.user);
    if (res.loadType === LoadTypes.Empty || res.loadType === LoadTypes.Error) {
      return interaction.editReply('❌ No results found.');
    }

    switch (res.loadType) {
      case LoadTypes.Track:
      case LoadTypes.Search: {
        const track = res.tracks[0];
        player.queue.add(track);
        if (!player.playing && !player.paused) {
          await player.play();
        }
        return interaction.editReply(
          `▶️ Added to queue: **${track.author} — ${track.title}**`
        );
      }

      case LoadTypes.Playlist: {
        // some bridges leave res.tracks empty, so fall back to res.playlist.tracks
        const tracks = res.tracks.length ? res.tracks : res.playlist.tracks;
        player.queue.add(tracks);
        if (!player.playing && !player.paused) {
          await player.play();
        }

        const now = await getNow();
        return interaction.editReply(
          `✅ Playlist queued: **${res.playlist.name}** — ${tracks.length} tracks\n\n` +
          `**Now Playing:**\n▶️ **${now?.author} — ${now?.title}**`
        );
      }
    }
  },
};
