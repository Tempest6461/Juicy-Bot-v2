const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const math = require("mathjs");

module.exports = {
  name: "math",
  category: "Misc",
  description: "Solves a math equation.",

  minArgs: 1,
  correctSyntax: "Correct syntax: {PREFIX}math {ARGS}",
  expectedArgs: "<question>",

  type: "BOTH",
  testOnly: false,
  reply: true,
  guildOnly: true,

  permissions: [PermissionFlagsBits.SendMessages],

  callback: ({ args }) => {
    var question = args.join(" ");

    let sum;
    try {
      sum = math.simplify(question);
    } catch (err) {
      return {
        content: "Sorry, I can't solve that.",
        ephemeral: true,
      };
    }

    const embed = new EmbedBuilder()
      .setTitle("Math")
      .setDescription(`${question} = ${sum}`)
      .setColor(0x0099ff);

    return {
      embeds: [embed],
    };
  },
};
