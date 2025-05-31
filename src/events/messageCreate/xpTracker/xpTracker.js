const UserXP = require("../../../../command-handler/models/user-xp-schema");
const {
  getLevelFromTotalXp,
} = require("../../../../command-handler/util/xpUtils");

const cooldowns = new Map();

module.exports = async (message) => {
  if (message.author.bot || !message.guild) return;

  const userId = message.author.id;
  const guildId = message.guild.id;
  const key = `${guildId}-${userId}`;

  const now = Date.now();
  if (cooldowns.has(key) && now - cooldowns.get(key) < 60000) return;
  cooldowns.set(key, now);

  const xpGained = Math.floor(Math.random() * 26) + 5; // 5-30 XP
  let userData = await UserXP.findOne({ userId, guildId });

  if (!userData) {
    userData = new UserXP({ userId, guildId, xp: 0, currentXp: 0, level: 0 });
  }

  userData.xp += xpGained;

  const { level: newLevel, currentXp } = getLevelFromTotalXp(userData.xp);

  // Check if level increased
  const leveledUp = newLevel > userData.level;

  userData.level = newLevel;
  userData.currentXp = currentXp;

  if (leveledUp) {
    const betterUsers = await UserXP.countDocuments({
      guildId: userData.guildId,
      $or: [
        { level: { $gt: newLevel } },
        { level: newLevel, xp: { $gt: userData.xp } },
      ],
    });

    userData.cachedRank = betterUsers + 1;
  }

  await userData.save();
};
