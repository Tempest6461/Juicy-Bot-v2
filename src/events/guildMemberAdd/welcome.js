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

module.exports = async (member, instance) => {
  const {
    guild: { id: guildId, channels, systemChannelId, name: guildName },
    user: { id: userId },
  } = member;

  const chanId = await instance.commandHandler.welcomeChannels.getWelcomeChannel(guildId);
  const welcomeChan = channels.cache.get(chanId ?? systemChannelId);
  if (!welcomeChan) return;

  const prefix = `Welcome, <@${userId}> to ${guildName}!`;

  // 50% AI, 50% legacy
  if (Math.random() < 0.5) {
    await welcomeChan.sendTyping();

    // 🔀 Use 20 randomly shuffled legacy examples for better variety
    const shuffledExamples = originalWelcome
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 20);

    const prompt = `New member joined. Write a funny, sarcastic welcome message that would follow this prefix: "${prefix}"`;

    const aiText = await generateReply("welcome", prompt, {
      interaction: { user: member.user },
      client: member.client,
      examples: shuffledExamples,
      maxTokens: 80,
    });

    if (aiText) {
      const trimmed = aiText.trim();

      // Avoid duplicated full prefix from model
      const cleaned =
        trimmed.startsWith("Welcome") && trimmed.includes(`<@${userId}>`)
          ? trimmed
          : `${prefix} ${trimmed}`;

      return welcomeChan.send(cleaned);
    }
  }

  // Legacy fallback
  const legacyMsg = swapLegacy();
  return welcomeChan.send(`${prefix} ${legacyMsg}`);
};
