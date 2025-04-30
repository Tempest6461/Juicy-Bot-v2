// src/commands/music/play.js
const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  name: "play",
  category: "Music",
  description: "Play a YouTube link or search keywords via Lavalink",
  type: "BOTH",
  guildOnly: true,
  options: [
    {
      name: "query",
      description: "The URL or keywords to play",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  callback: async ({ client, interaction, message, args }) => {
    const isSlash = Boolean(interaction);
    const reply = isSlash ? interaction : message;
    const member = isSlash ? interaction.member : message.member;

    // 1) Must be in a voice channel
    const vc = member.voice.channel;
    if (!vc) {
      return reply.reply({
        content: "🔈 You need to join a voice channel first!",
        ephemeral: true,
      });
    }

    const guildId = member.guild.id;
    // 2) Create or get the Lavalink player
    let player = client.manager.players.get(guildId);
    if (!player) {
      player = client.manager.create({
        guild: guildId,
        voiceChannel: vc.id,
        textChannel: isSlash ? interaction.channelId : message.channel.id,
        selfDeafen: true,
      });
    }
    if (player.state !== "CONNECTED") await player.connect();

    // 3) Set default volume to 100%
    player.setVolume(100);

    // 4) Perform the search (Lavalink auto-search)
    const query = isSlash
      ? interaction.options.getString("query")
      : args.join(" ");
    const res = await player.search(query, member.user);
    if (res.loadType === "NO_MATCHES" || !res.tracks.length) {
      return reply.reply({
        content: "❌ No results found.",
        ephemeral: true,
      });
    }

    // 5) Enqueue & play if not already
    const track = res.tracks[0];
    player.queue.add(track);
    if (!player.playing && !player.paused) player.play();

    return reply.reply({
      embeds: [
        {
          color: 0x1db954,
          title: "Now Playing",
          description: `▶️ **${track.title}**`,
        },
      ],
    });
  },
};
