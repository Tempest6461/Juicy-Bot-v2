const { PermissionFlagsBits, MessageFlagsBits } = require("discord.js");
const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "reminder",
  category: "Utility",
  description: "Set a reminder for yourself.",

  minArgs: 1,
  maxArgs: 2,
  expectedArgs: "<Time> <Reminder>",
  correctSyntax: "Correct syntax: {PREFIX}reminder <Time (e.g. 1h or 30m or 1h30m)> <Reminder>",

  type: "BOTH",
  testOnly: false,
  guildOnly: true,
  reply: true,

  cooldowns: {
    perUserPerGuild: "1 m",
  },

  permissions: [PermissionFlagsBits.SendMessages],

  callback: ({ message, args }) => {
    const time = args[0];
    const reminder = args.slice(1).join(" ");

    if (!time) {
      return {
        reply: "Please specify a time for your reminder.",
      };
    }

    if (!reminder) {
      return {
        reply: "Please specify a reminder.",
      };
    }

    let timeInMs = 0;
    let timeText = "";

    const hoursMatch = time.match(/(\d+)h/);
    const minutesMatch = time.match(/(\d+)m/);

    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      if (isNaN(hours)) {
        return {
          reply: "Please specify a valid time.",
        };
      }
      if (hours < 1) {
        return {
          reply: "Please specify a time greater than 0.",
        };
      }
      timeInMs += hours * 60 * 60 * 1000;
      timeText += `${hours} hour(s) `;
    }

    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1]);
      if (isNaN(minutes)) {
        return {
          reply: "Please specify a valid time.",
        };
      }
      if (minutes < 1) {
        return {
          reply: "Please specify a time greater than 0.",
        };
      }
      timeInMs += minutes * 60 * 1000;
      timeText += `${minutes} minute(s) `;
    }

    if (!hoursMatch && !minutesMatch) {
      return {
        reply: "Please specify a valid time format (e.g. 1h or 30m or 1h30m).",
      };
    }

    setTimeout(() => {
      const reminderEmbed = new MessageEmbed()
        .setColor("#FF0000")
        .setTitle("You have a reminder")
        .setDescription(`${reminder}`);

      message.reply(reminderEmbed);
    }, timeInMs);

    let replyMessage = `I will remind you in ${timeText.trim()}.`;

    return {
      content: replyMessage,
    };
  },
};
