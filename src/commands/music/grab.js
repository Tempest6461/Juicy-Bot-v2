// src/commands/music/grab.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'grab',
  description: 'DM the current track URL to you',
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

    // Retrieve the current track
    let currentTrack;
    if (typeof player.queue.getCurrent === 'function') {
      currentTrack = await player.queue.getCurrent();
    } else {
      currentTrack = player.queue.current;
    }
    if (!currentTrack) {
      return interaction.reply({ content: '📭 Nothing is playing right now.', ephemeral: true });
    }

    // DM embed
    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setTitle('Grabbed Track 🎶')
      .setDescription(`**[${currentTrack.title}](${currentTrack.uri})**`);

    try {
      await interaction.user.send({ embeds: [embed] });
      return interaction.reply({ content: "📩 I've DMed you the current track!", ephemeral: true });
    } catch (err) {
      return interaction.reply({ content: "❌ I couldn't DM you. Do you have DMs disabled?", ephemeral: true });
    }
  },
};