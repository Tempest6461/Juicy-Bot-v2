// src/events/messageCreate/randomChime.js
const { generateReply } = require("../../../command-handler/util/aiHandler.js");

module.exports = async function randomChime(message) {
  // Skip bots, DMs, system messages, and direct @Juicy pings
  if (
    message.author.bot ||
    !message.guild ||
    message.system ||
    message.mentions.has(message.client.user)
  ) return;

  try {
    await message.channel.sendTyping();

    // 1) Fetch the last 6 messages (this one + previous 5)
    const fetched = await message.channel.messages.fetch({ limit: 6 });
    const msgs = Array.from(fetched.values())
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    // 2) Build a history of the previous 5 messages (exclude the current one)
    const history = msgs
      .slice(0, -1)  // all but the newest
      .map((m) => ({
        role: m.author.id === message.client.user.id ? "assistant" : "user",
        content: m.content.slice(0, 500), // truncate long lines
      }));

    // 3) Your custom quick-chime examples
    const examples = [
      "What are you talking about",
      "Did someone say they wanna play SMITE?",
      "I got here just in time, right?",
      "Wait—who turned up the crazy?",
      "You really thought I'd stay silent?"
    ];

    // 4) Generate with full context
    const aiReply = await generateReply(
      "mention",             // or define a separate SYSTEM_PROMPTS.randomChime
      message.content.slice(0, 200).trim(),
      {
        history,
        examples,
        maxTokens: 50
      }
    );

    return message.reply(aiReply);

  } catch (err) {
    console.error("randomChime error:", err);
  }
};
