// src/commands/music/nowplaying.js
const music = require('../../../command-handler/command-handler/MusicHandler.js');

module.exports = {
  name: 'nowplaying',
  description: 'Show what’s currently playing',
  type: 'SLASH',
  guildOnly: true,
  callback: ({ interaction }) => {
    const current = music.getNowPlaying(interaction.guild.id);
    return interaction.reply(
      current
        ? `▶️ Now playing: **${current}**`
        : '❌ Nothing is playing right now.'
    );
  }
};
