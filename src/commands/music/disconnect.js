// src/commands/music/disconnect.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'disconnect',
  description: 'Stop playback and disconnect the bot from the voice channel',
  type: 'SLASH',
  guildOnly: true,

  callback: async ({ client, interaction }) => {
    const guildId = interaction.guildId;
    if (!guildId) {
      return interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
    }

    const player = client.magma.players.get(guildId);
    if (!player) {
      return interaction.reply({ content: '📭 Nothing is playing right now.', ephemeral: true });
    }

    // Stop playback and disconnect
    await player.stop();
    if (typeof player.destroy === 'function') {
      player.destroy();
    }

    // Confirmation embed
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setDescription('⏹️ Playback stopped and disconnected.');

    return interaction.reply({ embeds: [embed] });
  },
};
