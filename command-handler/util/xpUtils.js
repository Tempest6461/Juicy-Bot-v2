function getXpForNextLevel(level) {
  return 5 * level ** 2 + 50 * level + 100;
}

function getLevelFromTotalXp(totalXp) {
  let level = 0;
  let remaining = totalXp;

  while (true) {
    const needed = getXpForNextLevel(level);
    if (remaining < needed) break;
    remaining -= needed;
    level++;
  }

  return {
    level,
    currentXp: remaining
  };
}

module.exports = {
  getXpForNextLevel,
  getLevelFromTotalXp
};
