const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "8ball",
  category: "Fun",
  description: "Ask the magic 8ball a question.",

  minArgs: 1,
  correctSyntax: "Correct syntax: {PREFIX}8ball {ARGS}",
  expectedArgs: "<question>",

  type: "BOTH",
  testOnly: false,
  reply: true,
  guildOnly: true,

  permissions: [PermissionFlagsBits.SendMessages],

  callback: ({ args }) => {
    const question = args.join(" ");
    const randomNumber = Math.floor(Math.random() * 38);

    let eightBall = "";
    switch (randomNumber) {
      case 0:
        eightBall = "It is certain.";
        break;
      case 1:
        eightBall = "It is decidedly so.";
        break;
      case 2:
        eightBall = "Without a doubt.";
        break;
      case 3:
        eightBall = "Cannot predict now.";
        break;
      case 4:
        eightBall = "Don't count on it.";
        break;
      case 5:
        eightBall = "My sources say so.";
        break;
      case 6:
        eightBall = "Outlook not good.";
        break;
      case 7:
        eightBall = "Signs point to yes.";
        break;
      case 8:
        eightBall = "Very doubtful.";
        break;
      case 9:
        eightBall = "Without a doubt.";
        break;
      case 10:
        eightBall = "Even a blind squirrel finds a nut sometimes.";
        break;
      case 11:
        eightBall = "You may rely on it.";
        break;
      case 12:
        eightBall = "As I see it, yes.";
        break;
      case 13:
        eightBall = "I have a headache, ask me later.";
        break;
      case 14:
        eightBall = "Don't know, don't care.";
        break;
      case 15:
        eightBall = "Don't ask me, ask Google.";
        break;
      case 16:
        eightBall = "Why are you asking me?";
        break;
      case 17:
        eightBall = "You don't want to know the answer.";
        break;
      case 18:
        eightBall = "Toss a coin. Heads, yes. Tails, no.";
        break;
      case 19:
        eightBall = "Wouldn't you like to know?";
        break;
      case 20:
        eightBall = "What did you say? I wasn't listening.";
        break;
      case 21:
        eightBall = "What are you, stupid?";
        break;
      case 22:
        eightBall = "Obviously.";
        break;
      case 23:
        eightBall = "Why the hell would I know?";
        break;
      case 24:
        eightBall = "Ask again later.";
        break;
      case 25:
        eightBall = "Better not tell you now.";
        break;
      case 26:
        eightBall = "Why not?";
        break;
      case 27:
        eightBall = "Yes.";
        break;
      case 28:
        eightBall = "No.";
        break;
      case 29:
        eightBall = "Absolutely not.";
        break;
      case 30:
        eightBall = "Shake me harder.";
        break;
      case 31:
        eightBall = "Shake me again, I forgot.";
        break;
      case 32:
        eightBall = "That's a stupid question.";
        break;
      case 33:
        eightBall = "It's a no for you, but a yes for literally anybody else.";
        break;
      case 34:
        eightBall =
          "If I was created to answer questions like this, just kill me now.";
        break;
      case 35:
        eightBall = "Stop shaking me! Just do it, your future is bright.";
        break;
      case 36:
        eightBall = "Yes, but only if you do it.";
        break;
      case 37:
        eightBall = "Yes, but only for the next ten seconds.";
        break;
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(":8ball: Magic 8ball")
      .addFields([
        {
          name: "Question",
          value: question,
        },
        {
          name: "Answer",
          value: eightBall,
        },
      ]);

    return {
      embeds: [embed],
    };
  },
};
