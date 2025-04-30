// src/commands/utility/help.js
const {
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  name: "help",
  category: "Utility",
  description: "Show the interactive help menu.",
  type: "BOTH",
  guildOnly: true,
  permissions: [PermissionFlagsBits.SendMessages],

  callback: async ({ interaction, message }) => {
    const isSlash = Boolean(interaction);
    const user    = isSlash ? interaction.user    : message.author;
    const channel = isSlash ? interaction.channel : message.channel;

    // ─── Build the menu ─────────────────────────────────────────────────────
    const menu = new StringSelectMenuBuilder()
      .setCustomId("help-menu")
      .setPlaceholder("📚 Select a category")
      .addOptions([
        { label: "Main Menu",  value: "main",    emoji: "🤔", description: "Back to start" },
        { label: "Music",      value: "music",   emoji: "🎵", description: "All music commands" },
        { label: "Fun",        value: "fun",     emoji: "😂", description: "All fun commands" },
        { label: "Utility",    value: "utility", emoji: "🛠️", description: "All utility commands" },
        { label: "Testing",    value: "testing", emoji: "🧪", description: "All testing commands" },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    // ─── Embeds ───────────────────────────────────────────────────────────────
    const mainEmbed = new EmbedBuilder()
      .setTitle("🤔 Help Menu")
      .setDescription("Select a category below.")
      .setColor("Grey")
      .addFields([
        { name: "🎵 Music",   value: "`/help music`",   inline: true },
        { name: "😂 Fun",     value: "`/help fun`",     inline: true },
        { name: "🛠️ Utility", value: "`/help utility`", inline: true },
        { name: "🧪 Testing", value: "`/help testing`", inline: true },
      ]);

    const musicEmbed = new EmbedBuilder()
      .setTitle("🎵 Music Commands")
      .setColor(0x1DB954)
      .setDescription("Your music commands via Lavalink")
      .addFields([
        { name: "/play <query>",      value: "🔍 Search & play or enqueue",       inline: true },
        { name: "/pause",             value: "⏸️ Pause current track",             inline: true },
        { name: "/skip",              value: "⏭️ Skip to next track",              inline: true },
        { name: "/stop",              value: "⏹️ Stop & leave VC",                 inline: true },
        { name: "/queue view",        value: "📜 Show current queue",             inline: true },
        { name: "/queue add <query>", value: "➕ Add to queue",                   inline: true },
        { name: "/queue remove <#>",  value: "❌ Remove from queue",              inline: true },
        { name: "/queue clear",       value: "🗑️ Clear the entire queue",         inline: true },
        { name: "/queue reposition",  value: "🔀 Move track within queue",       inline: true },
        { name: "/volume <0.0–2.0>",  value: "🔊 Adjust playback volume",         inline: true },
        { name: "/nowplaying",        value: "🎶 Show current track",             inline: true },
        { name: "/trackhistory",      value: "📖 Last 5 played tracks",           inline: true },
      ]);

    const funEmbed = new EmbedBuilder()
      .setTitle("😂 Fun Commands")
      .setColor(0xffa500)
      .addFields([
        { name: "/coinflip",    value: "🪙 Flip a coin",           inline: true },
        { name: "/8ball",       value: "🔮 Ask the magic 8-ball",  inline: true },
        { name: "/dice",        value: "🎲 Roll a die",            inline: true },
        { name: "/dadjoke",     value: "😆 Get a dad joke",         inline: true },
        { name: "/probability", value: "📊 Chance of something",    inline: true },
        { name: "/say <text>",  value: "🗣️ Bot repeats your text",   inline: true },
      ]);

    const utilityEmbed = new EmbedBuilder()
      .setTitle("🛠️ Utility Commands")
      .setColor(0x0000ff)
      .addFields([
        { name: "/help",            value: "❓ Show this menu",          inline: true },
        { name: "/prefix <new>",    value: "🔤 Change bot prefix",      inline: true },
        { name: "/customcommand",   value: "➕ Create custom cmd",      inline: true },
        { name: "/delcustomcmd",    value: "❌ Delete custom cmd",      inline: true },
        { name: "/listcustomcmds",  value: "📋 List custom cmds",       inline: true },
        { name: "/reminder",        value: "⏰ Set a reminder",          inline: true },
        { name: "/mcserver-stats",  value: "🖥️ Minecraft stats",         inline: true },
        { name: "/mc-alerts",       value: "🚨 Toggle MC alerts",        inline: true },
      ]);

    const testingEmbed = new EmbedBuilder()
      .setTitle("🧪 Testing Commands")
      .setColor(0xffff00)
      .addFields([
        { name: "/simleave",     value: "👋 Simulate user leave",  inline: true },
        { name: "/simjoin",      value: "🤝 Simulate user join",   inline: true },
        { name: "/uptime",       value: "⏱️ Bot uptime",           inline: true },
        { name: "/welcomesetup", value: "🏷️ Configure welcome",    inline: true },
      ]);

    // ─── Send initial reply ─────────────────────────────────────────────────
    const payload = {
      embeds: [mainEmbed],
      components: [row],
      ephemeral: isSlash,
    };

    const sent = isSlash
      ? await interaction.reply(payload)
      : await channel.send(payload);

    // ─── Collector with idle & overall timeout ───────────────────────────────
    const collector = channel.createMessageComponentCollector({
      filter: (i) => i.customId === "help-menu" && i.user.id === user.id,
      idle:  60_000,   // 60s of inactivity
      time: 120_000,   // 120s total
    });

    collector.on("collect", async (i) => {
      let embed = mainEmbed;
      switch (i.values[0]) {
        case "music":   embed = musicEmbed;    break;
        case "fun":     embed = funEmbed;      break;
        case "utility": embed = utilityEmbed;  break;
        case "testing": embed = testingEmbed;  break;
      }
      await i.update({ embeds: [embed], components: [row] });
    });

    collector.on("end", async () => {
      // disable menu after end
      try {
        if (isSlash) {
          await interaction.editReply({ components: [] });
        } else {
          await sent.edit({ components: [] });
        }
      } catch {}
    });
  },
};
