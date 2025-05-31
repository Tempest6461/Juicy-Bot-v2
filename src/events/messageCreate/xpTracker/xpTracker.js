// src/events/messageCreate/xpTracker/xpTracker.js

const UserXP = require("../../../../command-handler/models/user-xp-schema");
const {
  getLevelFromTotalXp,
} = require("../../../../command-handler/util/xpUtils");
const { generateReply } = require("../../../../command-handler/util/aiHandler");

const cooldowns = new Map();

module.exports = async (message) => {
  if (message.author.bot || !message.guild) return;

  const userId = message.author.id;
  const guildId = message.guild.id;
  const key = `${guildId}-${userId}`;

  const now = Date.now();
  if (cooldowns.has(key) && now - cooldowns.get(key) < 60000) return;
  cooldowns.set(key, now);

  // Grant between 5–30 XP per message
  const xpGained = Math.floor(Math.random() * 26) + 5;
  let userData = await UserXP.findOne({ userId, guildId });

  if (!userData) {
    userData = new UserXP({ userId, guildId, xp: 0, currentXp: 0, level: 0 });
  }

  // 1) Add the new XP to their total
  userData.xp += xpGained;

  // 2) Recompute their level & XP‐into‐that‐level
  const { level: newLevel, currentXp } = getLevelFromTotalXp(userData.xp);

  // 3) Check if they actually increased a level
  const leveledUp = newLevel > userData.level;

  // 4) Update the stored level & currentXp
  userData.level = newLevel;
  userData.currentXp = currentXp;

  if (leveledUp) {
    // Recompute rank among all users in this guild
    const betterUsers = await UserXP.countDocuments({
      guildId: userData.guildId,
      $or: [
        { level: { $gt: newLevel } },
        { level: newLevel, xp: { $gt: userData.xp } },
      ],
    });
    userData.cachedRank = betterUsers + 1;

    // --------------- AI Level‐Up Message Logic -----------------
    // 1) Send a typing indicator so users see JuicyBot is “thinking”
    await message.channel.sendTyping();

    // 2) We define the fixed prefix we always want:
    const prefixText = `<@${userId}> Just reached ${newLevel}!`;

    // 3) Ask the AI for a JuicyBot‐style follow‐up, but do NOT include the prefix here.
    //    We keep the instruction very clear: "You are JuicyBot, give me a short, one-sentence,
    //    slang-filled, trolling quip about leveling up—WITHOUT repeating the prefix itself."
    const aiPrompt = `
You are JuicyBot. Someone just passed a level threshold in a Discord server. 
Do NOT repeat the prefix. Instead, write exactly one sentence of chaotic, slangy JuicyBot‐style banter responding to their level. 
For example: "look at you bro think you’re special now lol" or "lmao congrats nerd who cares lol"—channel‐style trolling. 
Keep it one line, no exclamation marks. 
`.trim();

    let aiResponse;
    try {
      // 4) Call generateReply with type "randomChime" (so it still inherits BASE_PROMPT).
      //    We pass aiPrompt as the “user content” and let the model create that one‐line quip.
      aiResponse = await generateReply("randomChime", aiPrompt, {
        client: message.client,
        message,
        maxTokens: 30, // short, one‐sentence output
      });
    } catch (err) {
      console.error("AI level-up follow‐up failed:", err);
      aiResponse = null;
    }

    // 5) If the AI failed or returned nothing, fallback to a simple one‐liner:
    if (!aiResponse || !aiResponse.trim()) {
      aiResponse = "🎉 congrats i guess you not totally worthless lol";
    }

    // 6) Finally, send the combined message: prefix + a space + AI’s quip.
    await message.channel.send(`${prefixText} ${aiResponse}`);
  }

  await userData.save();
};
