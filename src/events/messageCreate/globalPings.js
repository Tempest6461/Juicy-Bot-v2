// src/events/messageCreate/globalPings.js
const { PermissionFlagsBits } = require('discord.js');

const recentAttempts = new Map();
const pingAttempts   = new Map();

module.exports = async (message) => {
  // 1) Ignore DMs, bots, or if no guild/member
  if (!message.guild || !message.member || message.author.bot) return;

  // 2) Admins can always ping
  if (message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return;
  }

  // 3) Only care about @here or @everyone
  if (!message.content.includes('@here') && !message.content.includes('@everyone')) {
    return;
  }

  const authorId      = message.author.id;
  const channel       = message.channel;
  const now           = Date.now();
  const lastPingTime  = recentAttempts.get(authorId) || 0;
  const userData      = pingAttempts.get(authorId) || { count: 0, timestamp: now };

  // If within 60s window, increment count; otherwise reset
  if (now - lastPingTime < 60_000) {
    userData.count++;
  } else {
    userData.count     = 1;
    recentAttempts.set(authorId, now);
    // Reset that count after 60s
    setTimeout(() => {
      recentAttempts.delete(authorId);
      pingAttempts.set(authorId, { count: 0, timestamp: 0 });
    }, 60_000);
  }
  pingAttempts.set(authorId, userData);

  // 4) Build the warning text based on count
  let warning;
  switch (true) {
    case userData.count >= 6:
      warning = "How many times do I have to tell you? Go sit in the corner and think about what you've done."; 
      break;
    case userData.count >= 5:
      warning = "This is your last warning. I will not tolerate this behavior.";
      break;
    case userData.count >= 4:
      warning = "Are you trying to get banned? Because this is how you get banned.";
      break;
    case userData.count >= 3:
      warning = "You know, I have a lot of patience, but this is pushing it.";
      break;
    case userData.count >= 2:
      warning = "You do not have permission to use global pings. I just said that.";
      break;
    default:
      warning = "Sorry, you're not allowed to use global pings.";
  }

  // 5) Delete the original pinging message
  try {
    await message.delete();
  } catch (err) {
    console.error("globalPings: could not delete message:", err);
  }

  // 6) Send a fresh warning in the channel, mentioning the user
  try {
    await channel.send(`<@${authorId}> ${warning}`);
  } catch (err) {
    console.error("globalPings: could not send warning:", err);
  }

  // 7) If they’re on attempt 6+, also time them out
  if (userData.count >= 6) {
    try {
      await message.member.timeout(60 * 1000, "Abuse of global pings");
    } catch (err) {
      console.error("globalPings: timeout failed:", err);
    }
  }
};
