const { PermissionFlagsBits } = require("discord.js");
const UserXP = require("../../../command-handler/models/user-xp-schema");
const { getLevelFromTotalXp } = require("../../../command-handler/util/xpUtils");

module.exports = {
  name: "addxp",
  description: "🔧 DEBUG: Grant XP to a user.",
  category: "Debug",
  type: "SLASH",
  guildOnly: true,
  testOnly: false,

  options: [
    {
      name: "user",
      description: "User to give XP to",
      required: true,
      type: 6, // USER
    },
    {
      name: "amount",
      description: "XP amount to give",
      required: true,
      type: 4, // INTEGER
    },
  ],

  permissions: [PermissionFlagsBits.Administrator],

  callback: async ({ interaction }) => {
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    const guildId = interaction.guild.id;

    let userData = await UserXP.findOne({ userId: user.id, guildId });
    if (!userData) {
      userData = new UserXP({ userId: user.id, guildId, xp: 0, currentXp: 0, level: 1 });
    }

    userData.xp += amount;

    // Sync level and currentXp using lifetime XP
    const { level, currentXp } = getLevelFromTotalXp(userData.xp);
    userData.level = level;
    userData.currentXp = currentXp;

    await userData.save();

    return interaction.reply({
      content: `✅ Gave **${amount} XP** to ${user.tag}. Now Level **${level}** with **${currentXp} XP** into this level.`,
      ephemeral: true,
    });
  },
};
