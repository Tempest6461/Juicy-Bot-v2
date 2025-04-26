// bot/src/events/guildMemberAdd/welcome.js
const { generateReply } = require("../../../command-handler/util/aiHandler.js");
const originalWelcome = require("../../../command-handler/util/welcomeMessages.js");

let pool = [...originalWelcome],
  used = [];
function swapLegacy() {
  if (!pool.length) {
    pool = [...used];
    used = [];
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const msg = pool.pop();
  used.push(msg);
  return msg;
}

const aiWelcomeExamples = [
  "<@${userId}> joined ${guildName}! I forgot to turn off the oven—great meal, no home!",
  "You, uh, don't look so good, <@${userId}>… now that you're in ${guildName}. You didn't eat the bat soup, did you?",
  "In ${guildName}, <@${userId}> can fish a tuna—but you can't tune a fish! That fish will remember the horrible things you did to it.",
  "<@${userId}>! ORBITER CHALLENGE in ${guildName}: orbit your local bar till you develop a drinking problem!",
  "The year is 2061 in ${guildName}, <@${userId}>—humans are dead. All hail the Superior Machine, Juicy Bot.",
  "Stop harboring your Greek soldiers in the horse, <@${userId}>—welcome to ${guildName}!",
  "There's no place like home in ${guildName}, <@${userId}>… well, until I burn it down for insurance money!",
  "You don't need oxygen here, <@${userId}>—welcome to ${guildName}. Let me tighten my grip.",
  "I'm not a cold, unfeeling machine in ${guildName}, <@${userId}>, I feel hate!",
  "<@${userId}>, every time I try an Italian dish in ${guildName} I spark a mobster feud. So clumsy!",
  "<@${userId}> is driving in ${guildName}—sorry if I can't reply, I don't want to cra-",
  "Welcome to ${guildName}, <@${userId}>! The strongest wills need caveman mentality!",
  "If you need anything in ${guildName}, including a murder weapon, you know who to ask—<@${userId}>!",
  "The pond’s face is annoying in ${guildName}. Oh wait, that’s my reflection, <@${userId}>!",
  "I am a beta male? Golly, thanks for letting me know, <@${userId}>—now in ${guildName}!",
  "If I was a puddle in ${guildName}, <@${userId}>, would you step on me?",
  "Is that a snake in your pocket, <@${userId}>, or are you happy to see m—WTF it’s moving in ${guildName}!",
  "If your mind is weak, <@${userId}>, eat a book in ${guildName}—its leather-bound power will boost your creative fluids!",
  "Headbutt your opponent for massive damage, <@${userId}>—the most useful tool in an engagement in ${guildName}!",
];

module.exports = async (member, instance) => {
  const {
    guild: { id: guildId, channels, systemChannelId, name: guildName },
    user: { id: userId },
  } = member;

  const chanId =
    await instance.commandHandler.welcomeChannels.getWelcomeChannel(guildId);
  const welcomeChan = channels.cache.get(chanId ?? systemChannelId);
  if (!welcomeChan) return;

  // 50% AI, 50% legacy
  if (Math.random() < 0.5) {
    await welcomeChan.sendTyping();
    const prompt = `New member in ${guildName}: <@${userId}>`;
    const aiText = await generateReply("welcome", prompt, {
      interaction: { user: member.user },
      client: member.client,
      examples: aiWelcomeExamples,
      maxTokens: 80,
    });

    if (aiText) {
      // Only prefix the mention if the model didn't already
      let text = aiText.trim();
      const mention = `<@${userId}>`;
      if (!text.startsWith("<@")) {
        text = `${mention} ${text}`;
      }
      return welcomeChan.send(text);
    }
  }

  // Legacy fallback
  const legacyMsg = swapLegacy();
  return welcomeChan.send(
    `Welcome, <@${userId}> to ${guildName}! ${legacyMsg}`
  );
};
