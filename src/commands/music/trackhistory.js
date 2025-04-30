// src/commands/music/trackhistory.js
const music = require('../../../command-handler/command-handler/MusicHandler.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'trackhistory',
  description: 'Show the last 5 tracks that played',
  type: 'SLASH',
  guildOnly: true,
  callback: ({ interaction }) => {
    const hist = music.getHistory(interaction.guild.id);
    if (!hist.length) {
      return interaction.reply('No playback history yet.');
    }
    const embed = new EmbedBuilder()
      .setTitle('🕑 Track History')
      .setDescription(hist.map((t,i) => `**${i+1}.** ${t}`).join('\n'));
    return interaction.reply({ embeds: [embed] });
  }
};
