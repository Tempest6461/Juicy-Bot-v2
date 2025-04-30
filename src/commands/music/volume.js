// src/commands/music/volume.js
module.exports = {
  name: "volume",
  category: "Music",
  description: "Set volume (0.0–2.0).",
  type: "BOTH",
  guildOnly: true,
  minArgs: 1,
  correctSyntax: "{PREFIX}volume <0.0–2.0>",

  callback: ({ client, interaction, message, args }) => {
    const reply = interaction || message;
    const v = parseFloat(args[0]);
    if (isNaN(v) || v < 0 || v > 2) {
      return reply.reply("❌ Volume must be between 0.0 and 2.0");
    }

    const guildId = (interaction || message).guild.id;
    const player = client.manager.players.get(guildId);
    if (!player) {
      return reply.reply("❌ Nothing is playing.");
    }

    // Lavalink volume is 0–100+, so scale
    const vol = Math.round(v * 100);
    player.setVolume(vol);
    return reply.reply(`🔊 Volume set to **${v}** (${vol}%)`);
  },
};
