// src/commands/music/stop.js
module.exports = {
  name: "stop",
  category: "Music",
  description: "Stop playback and leave VC.",
  type: "BOTH",
  guildOnly: true,

  callback: ({ client, interaction, message }) => {
    const reply = interaction || message;
    const guildId = (interaction || message).guild.id;
    const player = client.manager.players.get(guildId);
    if (!player) {
      return reply.reply("❌ Nothing is playing.");
    }
    player.destroy(); // disconnects & removes the player
    return reply.reply("⏹ Stopped and disconnected.");
  },
};
