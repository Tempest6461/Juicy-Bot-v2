const UserXP = require("../../command-handler/models/user-xp-schema");

const CHUNK_SIZE = 100;
const CHUNK_DELAY_MS = 750;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function refreshGuildRanks(guildId) {
//   console.log(`🔄 Refreshing ranks for guild ${guildId}`);

  const users = await UserXP.find({ guildId }).sort([
    ["level", -1],
    ["xp", -1]
  ]);

  const chunks = Math.ceil(users.length / CHUNK_SIZE);

  for (let c = 0; c < chunks; c++) {
    const slice = users.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
    for (let i = 0; i < slice.length; i++) {
      const globalIndex = c * CHUNK_SIZE + i;
      const user = slice[i];
      const newRank = globalIndex + 1;
      if (user.cachedRank !== newRank) {
        user.cachedRank = newRank;
        await user.save();
      }
    }
    // console.log(`✅ Guild ${guildId} chunk ${c + 1}/${chunks} done`);
    await sleep(CHUNK_DELAY_MS);
  }
}

async function refreshRanks() {
  const guilds = await UserXP.distinct("guildId");

  for (const guildId of guilds) {
    try {
      await refreshGuildRanks(guildId);
    } catch (err) {
      console.warn(`⚠️ Failed to refresh ranks for guild ${guildId}:`, err.message);
    }
  }
}

module.exports = function startRankRefreshScheduler() {
  console.log("⏱️ Starting rank refresh scheduler...");
  setInterval(refreshRanks, 5 * 60 * 1000); // every 5 minutes
  refreshRanks(); // also run once at startup
};
