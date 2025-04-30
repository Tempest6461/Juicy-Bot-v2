// src/commands/music/pause.js
module.exports = {
  name: "pause",
  category: "Music",
  description: "Pause the current track.",
  type: "BOTH",
  guildOnly: true,

  callback: ({ client, interaction, message }) => {
    const reply = interaction || message;
    const guildId = (interaction || message).guild.id;
    const player = client.manager.players.get(guildId);
    if (!player || !player.playing) {
      return reply.reply("❌ Nothing is playing right now.");
    }
    player.pause(true);
    return reply.reply("⏸ Paused.");
  },
};
