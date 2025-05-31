// src/commands/utility/help.js
const fs = require("fs");
const path = require("path");
const {
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ApplicationCommandOptionType,
  ComponentType,
} = require("discord.js");

module.exports = {
  name: "help",
  category: "Utility",
  description: "Show help for all commands, or commands in a specific category",
  type: "BOTH",
  guildOnly: true,
  permissions: [PermissionFlagsBits.SendMessages],

  options: [
    {
      name: "category",
      description: "Which category to view",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: "Debug",   value: "debug"   },
        { name: "Fun",     value: "fun"     },
        { name: "Levels",  value: "levels"  },
        { name: "Music",   value: "music"   },
        { name: "Utility", value: "utility" },
      ],
    },
  ],

  callback: async ({ client, interaction, message, args }) => {
    const isSlash = Boolean(interaction);
    const user    = isSlash ? interaction.user : message.author;
    const channel = isSlash ? interaction.channel : message.channel;

    // Determine requested category
    const requested = isSlash
      ? interaction.options.getString("category")
      : args[0]?.toLowerCase();

    const categories = ["debug", "fun", "levels", "music", "utility"];
    const emojis = {
      main:    "🤔",
      debug:   "🐛",
      fun:     "😂",
      levels:  "📈",
      music:   "🎵",
      utility: "🛠️",
    };
    const colors = {
      main:    "Grey",
      debug:   0xff0000,
      fun:     0xffa500,
      levels:  0x9b59b6,
      music:   0x1db954,
      utility: 0x0000ff,
    };

    // Load commands by category
    const commandsByCategory = {};
    for (const cat of categories) {
      const dir = path.join(__dirname, "..", cat);
      const cmds = [];
      if (fs.existsSync(dir)) {
        for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) {
          const mod = require(path.join(dir, file));
          const name = mod.name || mod.data?.name;
          const desc = mod.description || mod.data?.description || "No description";
          if (name) cmds.push({ name, description: desc });
        }
      }
      commandsByCategory[cat] = cmds;
    }

    // If a category specified, send a simple embed
    if (requested && categories.includes(requested)) {
      const cmds = commandsByCategory[requested];
      const embed = new EmbedBuilder()
        .setTitle(`${emojis[requested]} ${requested[0].toUpperCase() + requested.slice(1)} Commands`)
        .setColor(colors[requested])
        .addFields(
          cmds.length
            ? cmds.map((c) => ({ name: `/${c.name}`, value: c.description, inline: true }))
            : [{ name: "—", value: "No commands here.", inline: false }]
        );
      if (isSlash) return interaction.reply({ embeds: [embed] });
      return channel.send({ embeds: [embed] });
    }

    // Build the interactive menu
    const dropdownOptions = categories.map((cat) => ({
      label: cat[0].toUpperCase() + cat.slice(1),
      value: cat,
    }));
    const menu = new StringSelectMenuBuilder()
      .setCustomId("help-menu")
      .setPlaceholder("Select a category")
      .addOptions(dropdownOptions);
    const row = new ActionRowBuilder().addComponents(menu);

    const mainEmbed = new EmbedBuilder()
      .setTitle(`${emojis.main} Help Menu`)
      .setDescription("Select a category below, or use `/help <category>`.")
      .setColor(colors.main)
      .addFields(
        categories.map((cat) => ({
          name:  `${emojis[cat]} ${cat[0].toUpperCase() + cat.slice(1)}`,
          value: `\`/help ${cat}\``,
          inline: true,
        }))
      );

    // Send public reply and capture the message
    let helpMsg;
    if (isSlash) {
      await interaction.reply({ embeds: [mainEmbed], components: [row] });
      helpMsg = await interaction.fetchReply();
    } else {
      helpMsg = await channel.send({ embeds: [mainEmbed], components: [row] });
    }

    // Collector: 5 minutes timeout
    const collector = helpMsg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.customId === "help-menu" && i.user.id === user.id,
      time: 5 * 60 * 1000,   // 5 minutes
    });

    collector.on("collect", async (i) => {
      const choice = i.values[0];
      const cmds   = commandsByCategory[choice] || [];
      const embed  = new EmbedBuilder()
        .setTitle(`📂 ${choice[0].toUpperCase() + choice.slice(1)} Commands`)
        .setColor(colors[choice])
        .setDescription(`Commands in **${choice}**:`)
        .addFields(
          cmds.length
            ? cmds.map((c) => ({ name: `/${c.name}`, value: c.description, inline: true }))
            : [{ name: "—", value: "No commands here.", inline: false }]
        );
      await i.update({ embeds: [embed], components: [row] });
    });

    collector.on("end", async () => {
      try {
        await helpMsg.delete();
      } catch {}
    });
  },
};
