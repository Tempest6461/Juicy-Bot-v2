// src/events/messageCreate/randomChime.js
const { generateReply } = require("../../../command-handler/util/aiHandler.js");
const AISettings     = require("../../../command-handler/models/ai-settings-schema.js");

module.exports = async function randomChime(message) {
  // Ignore bots, DMs, system messages, or direct pings
  if (
    message.author.bot ||
    !message.guild ||
    message.system ||
    message.mentions.has(message.client.user)
  ) return;

  // Fetch this guild's AI settings
  const settings = await AISettings.findOne({ guildId: message.guild.id });
  // If no settings or no channels configured, do nothing
  if (
    !settings ||
    !Array.isArray(settings.chimeChannelIds) ||
    settings.chimeChannelIds.length === 0
  ) {
    return;
  }

  // Only run in one of the configured channels
  if (!settings.chimeChannelIds.includes(message.channel.id)) return;

  // Skip if message has no text (but has attachments/embeds)
  const hasText = Boolean(message.content.trim());
  if (!hasText && (message.attachments.size > 0 || message.embeds.length > 0)) {
    return;
  }

  const content = message.content;
  // Convert stored percentage (0–100) into a probability (0–1)
  const rate = (settings.chimeRate ?? 0) / 100;
  // If rate is zero, don't ever chime
  if (rate <= 0) return;

  // Keyword-trigger OR random chance
  const containsKeyword = /(juicyBot)/i.test(content);
  const randomTrigger   = Math.random() < rate;
  if (!(containsKeyword || randomTrigger)) return;

  await message.channel.sendTyping();

  // Gather any attachments/embeds for image processing
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

  // Few-shot examples
  const examples = [
    "What are you talking about",
    "Did someone say they wanna play SMITE?",
    "I got here just in time, right?",
    "You really thought I'd stay silent?",
  ];

  // Call your AI handler
  const aiReply = await generateReply(
    "randomChime",
    content.slice(0, 200).trim(),
    {
      interaction: { user: message.author, member: message.member },
      client:      message.client,
      examples,
      maxTokens:   50,
      attachments,
    }
  );

  if (aiReply) {
    return message.reply(aiReply);
  }
};
