// src/events/messageCreate/randomChime.js
const { generateReply } = require("../../../command-handler/util/aiHandler.js");

module.exports = async function randomChime(message) {
  // Skip bots, DMs, system messages & direct pings of Juicy
  if (
    message.author.bot ||
    !message.guild ||
    message.system ||
    message.mentions.has(message.client.user)
  ) return;

  // Define content for reuse
  const content = message.content;

  // Trigger on keywords or random chance
  const containsKeyword = /(help|hype|juicy|juicyBot)/i.test(content);
  const randomTrigger   = Math.random() < 0.05; // 5% chance

  if (!(containsKeyword || randomTrigger)) {
    return;
  }

  await message.channel.sendTyping();

  // Custom examples
  const examples = [
    "What are you talking about",
    "Did someone say they wanna play SMITE?",
    "I got here just in time, right?",
    "Wait—who turned up the crazy?",
    "You really thought I'd stay silent?"
  ];

  // Generate AI reply with your 'randomChime' prompt type
  const aiReply = await generateReply("randomChime", content.slice(0,200).trim(), {
    interaction: {
      user: message.author,
      member: message.member        // ← ensures displayName is available
    },
    client: message.client,
    examples,
    maxTokens: 50
  });

  if (aiReply) {
    return message.reply(aiReply);
  }
  // If AI fails, do nothing
};
