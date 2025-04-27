// src/events/messageCreate/randomChime.js
const { generateReply } = require("../../../command-handler/util/aiHandler.js");

module.exports = async function randomChime(message) {
  if (
    message.author.bot ||
    !message.guild ||
    message.system ||
    message.mentions.has(message.client.user)
  ) return;

  // Skip if message is empty text but has attachments or embeds
  const hasText = Boolean(message.content.trim());
  if (!hasText && (message.attachments.size > 0 || message.embeds.length > 0)) return;

  await message.channel.sendTyping();

  // Gather attachments for image processing
  const attachments = [];
  for (const att of message.attachments.values()) {
    attachments.push({ url: att.url, name: att.name, contentType: att.contentType });
  }
  for (const emb of message.embeds) {
    const url = emb.image?.url || emb.thumbnail?.url;
    if (url) attachments.push({ url, name: url.split("/").pop(), contentType: "image/png" });
  }

  const content = message.content;
  const containsKeyword = /(help|hype|juicy|juicyBot)/i.test(content);
  const randomTrigger   = Math.random() < 0.01; // 1% chance to trigger
  if (!(containsKeyword || randomTrigger)) return;

  // Build few-shot examples
  const examples = [
    "What are you talking about",
    "Did someone say they wanna play SMITE?",
    "I got here just in time, right?",
    "Wait—who turned up the crazy?",
    "You really thought I'd stay silent?"
  ];

  // AI reply with centralized image processing
  const aiReply = await generateReply("randomChime", content.slice(0,200).trim(), {
    interaction: { user: message.author, member: message.member },
    client: message.client,
    examples,
    maxTokens: 50,
    attachments,
  });

  if (aiReply) return message.reply(aiReply);
};
