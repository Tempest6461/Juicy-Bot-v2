const {
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require("discord.js");
const wait = require("node:timers/promises").setTimeout;

module.exports = {
  name: "help",
  category: "Utility",
  description: "Get help with commands.",

  minArgs: 0,
  correctSyntax: "Correct syntax: {PREFIX}help",

  type: "BOTH",
  testOnly: true,
  reply: true,
  guildOnly: true,

  permissions: [PermissionFlagsBits.SendMessages],

  callback: ({ interaction, message, args }) => {
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("Help Menu")
        .setPlaceholder("Select a category")
        .addOptions([
          {
            label: "Help Menu",
            description: "List of categories.",
            value: "Help",
            customId: "Help",
            emoji: "🤔",
          },
          {
            label: "Fun",
            description: "Fun commands.",
            value: "Fun",
            customId: "Fun",
            default: false,
            emoji: "😂",
          },
          {
            label: "Utility",
            description: "Utility commands.",
            value: "Utility",
            customId: "Utility",
            default: false,
            emoji: "🛠️",
          },
          {
            label: "Testing",
            description: "Testing commands.",
            value: "Testing",
            customId: "Testing",
            default: false,
            emoji: "🧪",
          },
        ])
    );

    const helpEmbed = new EmbedBuilder()
      .setTitle("🤔 Help Menu")
      .setDescription(
        "`Please select a category from the dropdown menu below.`"
      )
      .setColor("Green")
      .addFields(
        {
          name: "Fun",
          value: "`Fun commands.`",
          inline: true,
        },
        {
          name: "Utility",
          value: "`Utility commands.`",
          inline: true,
        },
        {
          name: "Testing",
          value: "`Testing commands.`",
          inline: true,
        }
      );

    const funEmbed = new EmbedBuilder()
      .setTitle("😂 Fun")
      .setDescription("`Fun Commands.`")
      .setColor("Orange")
      .addFields(
        {
          name: "coinflip",
          value: "`Setle a dispute with a coinflip.`",
          inline: true,
        },
        {
          name: "8ball",
          value: "`Ask the magic 8ball a question.`",
          inline: true,
        },
        {
          name: "say",
          value: "`Make the bot say something.`",
          inline: true,
        }
      );

    const utilityEmbed = new EmbedBuilder()
      .setTitle("🛠️ Utility")
      .setDescription("`Utility Commands.`")
      .setColor("Blue")
      .addFields(
        {
          name: "help",
          value: "`Get help with commands.`",
          inline: true,
        },
        {
          name: "math",
          value: "`Get a solution to a math problem.`",
          inline: true,
        },
        {
          name: "welcomesetup",
          value: "`Setup the welcome channel.`",
          inline: true,
        },
        {
          name: "prefix",
          value: "`Change the bots prefix.`",
          inline: true,
        },
        {
          name: "customcommand",
          value: "`Create a custom command.`",
          inline: true,
        },
        {
          name: "delcustomcmd",
          value: "`Delete a custom command.`",
          inline: true,
        }
      );

    const testingEmbed = new EmbedBuilder()
      .setTitle("🧪 Testing")
      .setDescription("`Testing Commands.`")
      .setColor("Yellow")
      .addFields(
        {
          name: "simleave",
          value: "`Simulates a user leaving the server.`",
          inline: true,
        },
        {
          name: "simjoin",
          value: "`Simulates a user joining the server.`",
          inline: true,
        }
      );

    const helpMenuSelect = async () => {
      const filter = (i) => i.customId === "Help Menu";
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 60000,
      });
      collector.on("collect", async (i) => {
        if (i.values[0] === "Help") {
          await i.update({ embeds: [helpEmbed] });
        }
        if (i.values[0] === "Fun") {
          await i.update({ embeds: [funEmbed] });
        }
        if (i.values[0] === "Utility") {
          await i.update({ embeds: [utilityEmbed] });
        }
        if (i.values[0] === "Testing") {
          await i.update({ embeds: [testingEmbed] });
        }
      });
    };

    helpMenuSelect();

    return interaction
      .reply({
        embeds: [helpEmbed],
        components: [row],
        ephemeral: true,
      })
      .then(() => wait(60000))
      .then(() => interaction.deleteReply());
  },
};
