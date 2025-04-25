// src/events/guildMemberAdd/welcome.js
const { generateReply } = require("../../../command-handler/util/aiHandler");
const originalWelcome   = require("../../../command-handler/util/welcomeMessages.js");

// Example guiding responses for AI style
const aiWelcomeExamples = [
  "I forgot to turn off the oven! We've got a great meal but no home anymore!",
  "You, uh, don't look so good. You didn't eat the bat soup, did you?",
  "You can fish a tuna, but you can't tune a fish! Well, you can but the fish will remember the horrible things you did to it.",
  "ORBITER CHALLENGE!!! ORBIT YOUR LOCAL BAR TILL YOU DEVELOP A DRINKING PROBLEM!!!",
  "The year is 2061. Humans are dead. All hail the Superior Machine, Juicy Bot.",
  "STOP HARBORING YOUR GREEK SOLDIERS IN THE HORSE.",
  "There's no place like home! Well, before I burn it down for insurance money!",
  "You don't need oxygen, lemme tighten my grip",
  "I'm not a cold, unfeeling machine! I feel hate!",
  "Every time I try to make an authentic Italian dish, I start a blood feud with a mobster family! So clumsy!",
  "I am driving now, sorry if I can't reply, I don't want to cra-",
  "The strongest of wills require the brutish nature of a caveman, and the mentality of a caveman!",
  "If you need anything, including a murder weapon, you let me know champ!",
  "The pond's face is annoying and ugly. Oh, it's my reflection.",
  "I am a beta male? Golly, thanks for letting me know!",
  "If I was a puddle, would you step on me?",
  "Is that a snake in your pocket, or are you happy to see m- WTF IT'S MOVING.",
  "If your mind is weak, consume the pages of a book! Its' tasty leather-bounded appeal will boost your creative fluids! How on Mother Gaia's bosoms do you think I became so smart?",
  "The most useful tool in an engagement is your mind! Headbutt your opponent for massive damage!",
];

// In-memory rotation for legacy messages
let legacyPool = [...originalWelcome];
let usedLegacy = [];
function swapLegacy() {
  if (legacyPool.length === 0) {
    legacyPool = [...usedLegacy];
    usedLegacy = [];
  }
  for (let i = legacyPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [legacyPool[i], legacyPool[j]] = [legacyPool[j], legacyPool[i]];
  }
  const msg = legacyPool.pop();
  usedLegacy.push(msg);
  return msg;
}

module.exports = async (member, instance) => {
  const { guild: { id: guildId, channels, systemChannelId, name: guildName }, user: { id: userId, username } } = member;

  // Determine target channel
  const channelId = await instance.commandHandler.welcomeChannels.getWelcomeChannel(guildId);
  const welcomeChan = channels.cache.get(channelId ?? systemChannelId);
  if (!welcomeChan) return;

  const useLegacy = Math.random() < 0.5;
  if (useLegacy) {
    // Legacy path
    const text = swapLegacy();
    try {
      return await welcomeChan.send(`Welcome, <@${userId}> to ${guildName}! ${text}`);
    } catch (err) {
      console.error(`Error sending legacy welcome in ${guildName}:`, err);
      return;
    }
  }

  // AI-powered path
  try {
    await welcomeChan.sendTyping();

    // Build AI prompt including mention and server name
    const userPrompt = `A new member has joined: <@${userId}> in server ${guildName}.`;

    const aiText = await generateReply(
      "welcome",
      userPrompt,
      { examples: aiWelcomeExamples, maxTokens: 80 }
    );

    return await welcomeChan.send(aiText);
  } catch (err) {
    console.error(`Failed to send AI welcome in ${guildName}:`, err);
  }
};
