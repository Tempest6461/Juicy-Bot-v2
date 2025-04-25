/**
 * Set Juicy’s mood explicitly.
 * @param {import('discord.js').Client} client
 * @param {'happy'|'neutral'|'salty'|'hyped'} newMood
 */
function setMood(client, newMood) {
    if (!client.juicyState) return;
    client.juicyState.mood = newMood;
    client.juicyState.lastMoodChange = Date.now();
  }
  
  /**
   * Drift Juicy’s mood back toward “neutral” if enough time has passed.
   * Call this periodically (e.g. every minute).
   * @param {import('discord.js').Client} client
   */
  function decayMood(client) {
    if (!client.juicyState) return;
    const now = Date.now();
    // if it’s been 10+ minutes since the last change, go back to neutral
    if (now - client.juicyState.lastMoodChange > 10 * 60 * 1000) {
      client.juicyState.mood = 'neutral';
    }
  }
  
  module.exports = { setMood, decayMood };
  