// bot/command-handler/command-handler/MusicHandler.js

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus
} = require('@discordjs/voice');
const ytdlDiscord = require('ytdl-core-discord');
const playdl       = require('play-dl');
const yts          = require('yt-search');

class MusicHandler {
  constructor() {
    /** Map<guildId, { connection, player, queue, volume, disconnectTimer, textChannel }> */
    this.subs = new Map();
    this.AUTO_DISCONNECT_MS = 5 * 60e3; // 5 minutes
  }

  /** Enqueue a URL or keywords, return track title */
  async enqueue(guild, channel, query) {
    let url   = query;
    let title = null;

    // If not a YouTube URL, search first
    if (
      !/^https?:\/\/(www\.)?youtube\.com/.test(query) &&
      !/^https?:\/\/youtu\.be\//.test(query)
    ) {
      const { videos } = await yts(query);
      if (!videos.length) throw new Error('No results found.');
      url   = videos[0].url;
      title = videos[0].title;
    }

    // Create or get existing subscription
    let sub = this.subs.get(guild.id);
    if (!sub) {
      const connection = joinVoiceChannel({
        channelId:        channel.id,
        guildId:          guild.id,
        adapterCreator:   channel.guild.voiceAdapterCreator,
        selfDeaf:         false,
        selfMute:         false
      });
      const player = createAudioPlayer();
      connection.subscribe(player);

      sub = {
        connection,
        player,
        queue:            [],
        volume:           1.0,
        disconnectTimer:  null,
        textChannel:      channel
      };

      // When one track finishes, process the next
      player.on(AudioPlayerStatus.Idle, () =>
        this._processQueue(guild.id)
      );
      player.on('error', err =>
        channel.send(`🔴 Playback error: ${err.message}`)
      );

      this.subs.set(guild.id, sub);
    }

    // If no title yet, try pulling it from ytdl or re-search
    if (!title) {
      try {
        const info = await ytdlDiscord(query, {
          filter:      'audioonly',
          opusEncoded: true
        });
        title = info.videoDetails.title;
      } catch {
        const { videos } = await yts(url);
        title = (videos.find(v => v.url === url) || videos[0]).title;
      }
    }

    sub.queue.push({ url, title });

    // If nothing is currently playing, kick off the queue
    if (sub.player.state.status !== AudioPlayerStatus.Playing) {
      this._processQueue(guild.id);
    }

    return title;
  }

  /** Internal: pull next track, announce it, then play via ytdl or play-dl */
  async _processQueue(guildId) {
    const sub = this.subs.get(guildId);
    if (!sub) return;

    const next = sub.queue.shift();
    if (!next) {
      // nothing left—schedule auto-disconnect
      sub.disconnectTimer = setTimeout(() => {
        sub.connection.destroy();
        this.subs.delete(guildId);
      }, this.AUTO_DISCONNECT_MS);
      return;
    }

    // if we were going to disconnect, cancel that now
    if (sub.disconnectTimer) {
      clearTimeout(sub.disconnectTimer);
      sub.disconnectTimer = null;
    }

    // ── **TRACK ANNOUNCE** ───────────────────────────────────────────────
    sub.textChannel.send(`▶️ Now playing **${next.title}**`);
    // ─────────────────────────────────────────────────────────────────────

    // Try ytdl-core-discord first
    try {
      const opusStream = await ytdlDiscord(next.url, {
        filter:        'audioonly',
        opusEncoded:   true,
        highWaterMark: 1 << 25
      });
      const resource = createAudioResource(opusStream, {
        inputType:   StreamType.Opus,
        inlineVolume: true
      });
      resource.volume.setVolume(sub.volume);
      sub.player.play(resource);
      return;
    } catch (err) {
      console.warn(
        `[Music] ytdl-core-discord failed (${err.message}), falling back to play-dl`
      );
    }

    // Fallback: play-dl
    try {
      const { stream, type } = await playdl.stream(next.url);
      const inputType = type === 'opus'
        ? StreamType.Opus
        : type === 'ogg_opus'
        ? StreamType.OggOpus
        : StreamType.Arbitrary;
      const resource = createAudioResource(stream, {
        inputType, inlineVolume: true
      });
      resource.volume.setVolume(sub.volume);
      sub.player.play(resource);
    } catch (err) {
      sub.textChannel.send(
        `⚠️ Skipping **${next.title}**: ${err.message}`
      );
      // move on to the next track
      this._processQueue(guildId);
    }
  }

  skip(guildId) {
    const sub = this.subs.get(guildId);
    if (!sub || sub.player.state.status !== AudioPlayerStatus.Playing) {
      throw new Error('Nothing is playing right now.');
    }
    sub.player.stop();
  }

  stop(guildId) {
    const sub = this.subs.get(guildId);
    if (!sub) throw new Error('Not connected to a voice channel.');
    sub.queue = [];
    sub.player.stop();
    sub.connection.destroy();
    this.subs.delete(guildId);
  }

  pause(guildId) {
    const sub = this.subs.get(guildId);
    if (!sub || sub.player.state.status !== AudioPlayerStatus.Playing) {
      throw new Error('No track to pause.');
    }
    sub.player.pause();
  }

  resume(guildId) {
    const sub = this.subs.get(guildId);
    if (!sub || sub.player.state.status !== AudioPlayerStatus.Paused) {
      throw new Error('Nothing is paused.');
    }
    sub.player.unpause();
  }

  getQueue(guildId) {
    const sub = this.subs.get(guildId);
    return sub ? sub.queue.map(i => i.title) : [];
  }

  remove(guildId, pos) {
    const sub = this.subs.get(guildId);
    if (!sub) throw new Error('No queue for this guild.');
    if (pos < 1 || pos > sub.queue.length)
      throw new Error('Position out of range.');
    return sub.queue.splice(pos - 1, 1)[0].title;
  }

  setVolume(guildId, volume) {
    const sub = this.subs.get(guildId);
    if (!sub) throw new Error('Not connected to a voice channel.');
    sub.volume = volume;
    const res = sub.player.state.resource;
    if (res?.volume) res.volume.setVolume(volume);
  }
}

module.exports = new MusicHandler();
