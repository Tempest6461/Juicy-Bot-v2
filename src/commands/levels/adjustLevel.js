const { PermissionFlagsBits } = require("discord.js");
const UserXP = require("../../../command-handler/models/user-xp-schema");
const { getXpForNextLevel } = require("../../../command-handler/util/xpUtils");

module.exports = {
  name: "adjustlevel",
  description: "🔧 DEBUG: Adjust a user's level (increase, decrease, or set).",
  category: "Levels",
  type: "SLASH",
  guildOnly: true,
  testOnly: false,

  options: [
    {
      name: "user",
      description: "User whose level to adjust",
      required: true,
      type: 6, // USER
    },
    {
      name: "action",
      description: "Action to perform",
      required: true,
      type: 3, // STRING
      choices: [
        { name: "increase", value: "increase" },
        { name: "decrease", value: "decrease" },
        { name: "set", value: "set" },
      ],
    },
    {
      name: "amount",
      description: "Number of levels (or target level for set). Default: 1",
      required: false,
      type: 4, // INTEGER
    },
  ],

  permissions: [PermissionFlagsBits.Administrator],

  callback: async ({ interaction }) => {
    const user = interaction.options.getUser("user");
    const action = interaction.options.getString("action");
    const inputAmount = interaction.options.getInteger("amount");
    const guildId = interaction.guild.id;
    const amount = inputAmount !== null ? inputAmount : 1;

    let userData = await UserXP.findOne({ userId: user.id, guildId });
    if (!userData) {
      userData = new UserXP({ userId: user.id, guildId, xp: 0, level: 1 });
    }

    let msg = `🔧 Adjusting level for **${user.tag}**…\n`;

    // Helpers for increase/decrease loops
    const applyIncrease = (levels) => {
      for (let i = 0; i < levels; i++) {
        const needed = getXpForNextLevel(userData.level);
        userData.xp += needed;
        userData.level++;
        msg += `→ Increased to Level **${userData.level}**\n`;
      }
    };

    const applyDecrease = (levels) => {
      for (let i = 0; i < levels; i++) {
        if (userData.level <= 1) {
          msg += `→ Already at minimum level 1\n`;
          break;
        }
        const prevLevel = userData.level - 1;
        const xpToSubtract = getXpForNextLevel(prevLevel);
        userData.xp = Math.max(0, userData.xp - xpToSubtract);
        userData.level--;
        msg += `→ Decreased to Level **${userData.level}**\n`;
      }
    };

    // Perform the selected action
    switch (action) {
      case "increase":
        applyIncrease(amount);
        break;
      case "decrease":
        applyDecrease(amount);
        break;
      case "set":
        if (amount < 1) {
          msg += `→ Target level must be at least 1\n`;
        } else if (amount > userData.level) {
          applyIncrease(amount - userData.level);
        } else if (amount < userData.level) {
          applyDecrease(userData.level - amount);
        } else {
          msg += `→ Already at Level **${userData.level}**\n`;
        }
        break;
      default:
        msg += `→ Unknown action: ${action}\n`;
    }

    await userData.save();
    return interaction.reply({ content: msg, ephemeral: true });
  },
};
