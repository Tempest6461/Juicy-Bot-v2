// bot/command-handler/command-handler/MusicHandler.js
const { EmbedBuilder } = require('discord.js');

class MusicHandler {
  constructor(client) {
    this.client = client;
    this.disconnectTimers = new Map();
    this.history = new Map();
    // Expose handler for commands
    client.musicHandler = this;

    client.magma
      .on('playerCreate', (player) => {
        this.clearTimer(player.guildId);
      })
      .on('playerDestroy', (player) => {
        this.clearTimer(player.guildId);
      })
      .on('trackStart', (player, track) => {
        this.clearTimer(player.guildId);
        // Record track in history (max 50 entries)
        const guildHistory = this.history.get(player.guildId) || [];
        guildHistory.push({ title: track.title, uri: track.uri });
        if (guildHistory.length > 50) guildHistory.shift();
        this.history.set(player.guildId, guildHistory);

        const channel = this.client.channels.cache.get(player.textChannel);
        if (channel?.send) {
          channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x1db954)
                .setTitle('▶️ Now Playing')
                .setDescription(`[${track.title}](${track.uri})`),
            ],
          }).catch(() => {});
        }
      })
      .on('queueEnd', (player) => {
        this.scheduleDisconnect(player.guildId);
      })
      .on('trackError', (player, track, err) => {
        const channel = this.client.channels.cache.get(player.textChannel);
        if (channel?.send) {
          channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Track Error')
                .setDescription(`Failed to play: **${track.title}**\n${err?.message || err}`),
            ],
          }).catch(() => {});
        }
        player.stop();
      })
      .on('trackStuck', (player, track) => {
        const channel = this.client.channels.cache.get(player.textChannel);
        if (channel?.send) {
          channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0xffa500)
                .setTitle('⚠️ Track Stuck')
                .setDescription(`Skipping: **${track.title}**`),
            ],
          }).catch(() => {});
        }
        player.stop();
      });

    client.on('voiceStateUpdate', (oldState, newState) =>
      this.onVoiceStateUpdate(oldState, newState)
    );
  }

  clearTimer(guildId) {
    const timer = this.disconnectTimers.get(guildId);
    if (timer) clearTimeout(timer);
    this.disconnectTimers.delete(guildId);
  }

  scheduleDisconnect(guildId) {
    this.clearTimer(guildId);
    const player = this.client.magma.players.get(guildId);
    if (!player) return;
    const timer = setTimeout(() => {
      player.destroy();
      this.disconnectTimers.delete(guildId);
    }, 5 * 60 * 1000);
    this.disconnectTimers.set(guildId, timer);
  }

  onVoiceStateUpdate(oldState, newState) {
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      const guildId = oldState.guild.id;
      const player = this.client.magma.players.get(guildId);
      if (!player) return;
      if (oldState.channelId === player.voiceChannel) {
        const channel = oldState.guild.channels.cache.get(
          player.voiceChannel
        );
        if (!channel) return;
        const humanCount = channel.members.filter((m) => !m.user.bot).size;
        if (humanCount === 0) {
          this.clearTimer(guildId);
          player.destroy();
        }
      }
    }
  }
}

module.exports = MusicHandler;