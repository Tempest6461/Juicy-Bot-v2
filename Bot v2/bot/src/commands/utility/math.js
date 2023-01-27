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
      sum = math.evaluate(question);
    } catch (err) {
      return {
        try: { content: `Error: ${err}` },
      };
    }

    const embed = new EmbedBuilder()
      .setTitle("Math")
      .setDescription(`${question} = ${sum}`)
      .setColor(0x0099ff);

    return {
      // content: `${question} = ${sum}`,
      embeds: [embed],
    };
  },
};
