// src/commands/music/skip.js
module.exports = {
  name: "skip",
  category: "Music",
  description: "Skip the current track",
  type: "BOTH",
  guildOnly: true,

  callback: ({ client, interaction, message }) => {
    const reply = interaction || message;
    const guildId = (interaction || message).guild.id;
    const player = client.manager.players.get(guildId);
    if (!player || !player.queue.size) {
      return reply.reply("❌ Nothing to skip.");
    }
    player.stop(); // ends the current track, Lavalink will automatically start the next
    return reply.reply("⏭ Skipped.");
  },
};
