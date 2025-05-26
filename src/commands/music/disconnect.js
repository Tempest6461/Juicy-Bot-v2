// src/commands/music/disconnect.js
module.exports = {
    name: 'disconnect',
    category: 'Music',
    description: 'Disconnect the bot from the voice channel.',
    type: 'BOTH',
    guildOnly: true,
    callback: ({ interaction, message, client }) => {
      const resp  = interaction || message;
      const guild = interaction ? interaction.guild : message.guild;
      const player = client.manager.players.get(guild.id);
  
      if (!player) {
        return resp.reply('❌ I’m not connected to any voice channel.');
      }
  
      player.destroy(); // disconnect + clean up
      return resp.reply('👋 Disconnected.');
    }
  };
  