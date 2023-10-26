const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "dice",
  category: "Fun",
  description: "Rolls a die of your choice.",
  usage: "[type] [modifier]", // Argument to decide the type of die to roll and an optional modifier

  correctSyntax: "Correct syntax: {PREFIX}dice [type] [modifier]",

  options: [
    {
      name: "type",
      description: "The type of die to roll (6 or 20)",
      type: 3,
      required: true,
      choices: [
        {
          name: "6 sided die",
          value: "6",
        },
        {
          name: "20 sided die",
          value: "20",
        },
      ],
    },
    {
      name: "modifier",
      description: "The modifier to apply to the roll",
      type: 4,
      required: false,
    },
  ],

  minArgs: 0,
  type: "BOTH",
  testOnly: false,
  reply: true,
  guildOnly: true,

  permissions: [PermissionFlagsBits.SendMessages],

  callback: ({ args }) => {
    const diceType = args[0];
    const modifier = args[1] ? parseInt(args[1]) : 0; // Parse the modifier, default to 0 if not provided
    const diceTypes = ["6", "20"];

    if (!diceType) {
      return {
        content: `Please specify the type of die to roll. Available types: ${diceTypes.join(
          ", "
        )}`,
      };
    }

    if (!diceTypes.includes(diceType)) {
      return {
        content: `Please specify a valid type of die to roll. Available types: ${diceTypes.join(
          ", "
        )}`,
      };
    }

    const random = Math.floor(Math.random() * diceType) + 1;
    const result = random + modifier;

    const embed = new EmbedBuilder()
      .setTitle(
        `You rolled a ${random} on a ${diceType}-sided die with a modifier of ${modifier}.`
      )
      .setColor("#0099ff");

    if (diceType === "20") {
      switch (
        random // Switch statement to determine the result of the roll
      ) {
        case 1:
          embed.setDescription("Critical failure!");
          embed.setImage("https://i.imgur.com/bpD3pOz.png");
          return { embeds: [embed] };
        case 2:
          embed.setDescription("Major failure!");
          embed.setImage("https://i.imgur.com/xacdXwR.png");
          return { embeds: [embed] };
        case 3:
          embed.setDescription("Huge failure!");
          embed.setImage("https://i.imgur.com/VZ7XXdY.png");
          return { embeds: [embed] };
        case 4:
          embed.setDescription("Failure!");
          embed.setImage("https://i.imgur.com/freY4dk.png");
          return { embeds: [embed] };
        case 5:
          embed.setDescription("Failure!");
          embed.setImage("https://i.imgur.com/GQ6Wdy8.png");
          return { embeds: [embed] };
        case 6:
          embed.setDescription("Not great.");
          embed.setImage("https://i.imgur.com/5vbRsrc.png");
          return { embeds: [embed] };
        case 7:
          embed.setDescription("Not good.");
          embed.setImage("https://i.imgur.com/uGB1SZx.png");
          return { embeds: [embed] };
        case 8:
          embed.setDescription("Meh.");
          embed.setImage("https://i.imgur.com/7QexH2z.png");
          return { embeds: [embed] };
        case 9:
          embed.setDescription("Average!");
          embed.setImage("https://i.imgur.com/Ksjn4Tt.png");
          return { embeds: [embed] };
        case 10:
          embed.setDescription("Average.");
          embed.setImage("https://i.imgur.com/VjVINNP.png");
          return { embeds: [embed] };
        case 11:
          embed.setDescription("Average.");
          embed.setImage("https://i.imgur.com/cSUtJLg.png");
          return { embeds: [embed] };
        case 12:
          embed.setDescription("Good!");
          embed.setImage("https://i.imgur.com/3ZLM8WW.png");
          return { embeds: [embed] };
        case 13:
          embed.setDescription("Good!");
          embed.setImage("https://i.imgur.com/37HmBtJ.png");
          return { embeds: [embed] };
        case 14:
          embed.setDescription("Great!");
          embed.setImage("https://i.imgur.com/vwaKKHF.png");
          return { embeds: [embed] };
        case 15:
          embed.setDescription("Success!");
          embed.setImage("https://i.imgur.com/YEk4gBL.png");
          return { embeds: [embed] };
        case 16:
          embed.setDescription("Success!");
          embed.setImage("https://i.imgur.com/o5Nn2IX.png");
          return { embeds: [embed] };
        case 17:
          embed.setDescription("Success!");
          embed.setImage("https://i.imgur.com/HmBxPxM.png");
          return { embeds: [embed] };
        case 18:
          embed.setDescription("Huge success!");
          embed.setImage("https://i.imgur.com/zSO7jAr.png");
          return { embeds: [embed] };
        case 19:
          embed.setDescription("Major success!");
          embed.setImage("https://i.imgur.com/RI038hI.png");
          return { embeds: [embed] };
        case 20:
          embed.setDescription("You're a Natural!");
          embed.setImage("https://i.imgur.com/v3Tcyj3.png");
          return { embeds: [embed] };
        default:
          return {
            content: `You rolled a ${random} on a ${diceType}-sided die with a modifier of ${modifier}. Result: ${result}.`,
          };
      }
    } else {
      return { embeds: [embed] };
    }
  },
};
