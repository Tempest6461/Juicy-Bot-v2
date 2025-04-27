// src/events/messageCreate/randomChime.js
const { generateReply } = require("../../../command-handler/util/aiHandler.js");

// ─── Configure per-guild chime rates here ───────────────────────────────────
// Keys are guild IDs, values are probabilities (0.0–1.0)
const guildChimeRates = {
  "1212531349781749831": 0.1, // 10% chance in Champions Guild
  "592495831169368112": 0.05, // 5% chance in Unknown Gods
  "1142294151229100116": 0.0, // 0% chance in Gorrilla Goonz
  "529877137268670465": 1, // 100% chance in Testing/Archive
};

// Default fallback chance (e.g. 1% globally)
const DEFAULT_CHIME_RATE = 0.01;

module.exports = async function randomChime(message) {
  if (
    message.author.bot ||
    !message.guild ||
    message.system ||
    message.mentions.has(message.client.user)
  )
    return;

  // Skip if message is empty text but has attachments or embeds
  const hasText = Boolean(message.content.trim());
  if (!hasText && (message.attachments.size > 0 || message.embeds.length > 0))
    return;

  await message.channel.sendTyping();

  // Gather attachments for image processing
  const attachments = [];
  for (const att of message.attachments.values()) {
    attachments.push({
      url: att.url,
      name: att.name,
      contentType: att.contentType,
    });
  }
  for (const emb of message.embeds) {
    const url = emb.image?.url || emb.thumbnail?.url;
    if (url) {
      attachments.push({
        url,
        name: url.split("/").pop(),
        contentType: "image/png",
      });
    }
  }

  const content = message.content;

  // Keyword trigger stays the same
  const containsKeyword = /(help|hype|juicy|juicyBot)/i.test(content);

  // Determine this guild's chance
  const guildId = message.guild.id;
  const rate = guildChimeRates[guildId] ?? DEFAULT_CHIME_RATE;

  // Log the check for debugging
  console.log(`[randomChime] Checking guild ${guildId}: rate = ${rate}`);

  const randomTrigger = Math.random() < rate;

  if (!(containsKeyword || randomTrigger)) return;

  // Build few-shot examples
  const examples = [
    "What are you talking about",
    "Did someone say they wanna play SMITE?",
    "I got here just in time, right?",
    "Wait—who turned up the crazy?",
    "You really thought I'd stay silent?",
  ];

  // AI reply with centralized image processing
  const aiReply = await generateReply(
    "randomChime",
    content.slice(0, 200).trim(),
    {
      interaction: { user: message.author, member: message.member },
      client: message.client,
      examples,
      maxTokens: 50,
      attachments,
    }
  );

  if (aiReply) return message.reply(aiReply);
};
