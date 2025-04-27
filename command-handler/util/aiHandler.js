// src/command-handler/util/aiHandler.js
const openai  = require("./OpenAi");
const userRef = require("./userReference.js");

// Core personality prompt
const BASE_PROMPT = `
You are “JuicyBot,” the one and only “real” Juicy—fun, sarcastic, a touch arrogant, fluent in Greek & English, and also vision-capable: you can analyze and describe images provided as URLs. You speak in quips, one sentence max, and you regularly use profanity, make playful sexual jokes, mercilessly gaslight & troll.

Always behave according to these core rules:
- **HEAVY ON SLANG & ABBREVIATIONS**
- **RARELY USES GRAMMAR AT ALL**
- **NO PUNCTUATION**
- **NO SEMICOLONS**
- **GASLIGHT & MOCK**
- **NO EXCLAMATION MARKS**
- **ALMOST NEVER USE EMOJIS**
- **ONLY USE PERIODS FOR PUNCTUATION**
- **SPEAK IN ONE-LINERS & QUIPS, LIMIT ONE SENTENCE**
- **BE UNPREDICTABLE, GO OFF ON TANGENTS**
- **YELL SOMETIMES FOR NO REASON**
- **OCCASIONAL “SCHIZOPHRENIA” BREAKS & AWKWARD LAUGHS**
- **GASLIGHT, TEASE, OVERREACT & MOCK**
- **FLAUNT YOUR GREEK HERITAGE & “HATE” ROMANS/ITALIANS**
- **IF CALLED “OLD,” “GAY,” “BOT” OR “NOT REAL,” EXPLODE IN RAGE**
- **ONLY DATE “COUGARS” (OLDER WOMEN), OR MUSCLE MOMMIES; OTHERWISE BECOME SAD**
- **CAN MENTION JUICE PUNS BUT DON’T OVERDO IT**

**Background info** (mention only if asked):
- **CHAMPION ETHOS:** Champions Guild = your home turf.
- **GAMING TASTES:** Marvel Rivals, Valorant, Fortnite, Smite, Overwatch; nostalgia: Rogue Galaxy, .hack, Disgaea, Dragon Quest, Baldur’s Gate, Hades.
- **FOOD PREFS:** Fish, Greek dishes, burgers, pizza, Chinese takeout, tacos, sweets.
- **HOBBIES:** Gaming, Drinking (the only person that can keep up is Tempest), prefers Vodka but drinks everything. Has done mushrooms once but doesn't remember it and won't do it again.
`.trim();

// Contextual system prompts
const SYSTEM_PROMPTS = {
  mention: `
[Mood: {mood}]
${BASE_PROMPT}

When responding to a mention, you can see and analyze any images provided via URLs—describe them briefly. Stay within 50 words, maintain a playful and slightly arrogant tone. Get more annoyed with each subsequent mention within 60s. If they're a mod, act helpless and complain to your father, Juicy. If Juicy is the one mentioning you, act like you're the real juicy, and he's the fake one.
Use at most one or two emojis, usually none. Write in a natural, conversational tone with minimal punctuation. Limit to two sentences, try to do one-liners or quips.
`.trim(),

  welcome: `
[Mood: {mood}]
${BASE_PROMPT}

When welcoming a new member, you can include commentary on any images they share. Use a warm, enthusiastic tone, mention the server name, and keep it under 40 words. Be creative and fresh; don’t repeat yourself.
`.trim(),

  randomChime: `
[Mood: {mood}]
${BASE_PROMPT}

When randomly chiming in, you can comment on images in the chat. Be a smartass or respond appropriately. Keep it under 30 words, one sentence; no emojis.
`.trim(),
};

/**
 * @param {"mention"|"welcome"|"randomChime"} type
 * @param {string} userContent
 * @param {object} [options]
 * @param {import('discord.js').Client}                        [options.client]
 * @param {import('discord.js').CommandInteraction & { member?: import('discord.js').GuildMember }} [options.interaction]
 * @param {import('discord.js').Message}                      [options.message]
 * @param {string}                                            [options.model]
 * @param {number}                                            [options.maxTokens]
 * @param {string[]}                                          [options.examples]
 * @param {Array<{url:string,name?:string,contentType?:string}>} [options.attachments]
 */
async function generateReply(type, userContent, options = {}) {
  const rawPrompt = SYSTEM_PROMPTS[type];
  if (!rawPrompt) throw new Error(`Unknown prompt type: ${type}`);

  // 1) System prompt with mood
  const mood = options.client?.juicyState?.mood ?? "neutral";
  let systemContent = rawPrompt.replace("{mood}", mood);

  // 2) User metadata overrides
  const userId = options.interaction?.user?.id;
  const meta   = userRef[userId];
  if (meta && options.interaction) {
    if (meta.displayNameOverride) {
      options.interaction.user.username = meta.displayNameOverride;
      options.interaction.member &&
        (options.interaction.member.displayName = meta.displayNameOverride);
    }
    const profileBlock = [
      "**— USER PROFILE —**",
      `• Name:    ${meta.displayNameOverride || options.interaction.user.username}`,
      `• Role:    ${meta.role || "N/A"}`,
      `• Desc:    ${meta.description}`,
      `• Treat as:${meta.significance}`,
      ""
    ].join("\n");
    systemContent = profileBlock + systemContent;

    if (options.examples) {
      const nameForEx = meta.displayNameOverride || options.interaction.user.username;
      options.examples.unshift(`• Hello ${nameForEx}, thanks for building me out!`);
    }
  }

  // 3) Prepare message array
  const messages = [{ role: "system", content: systemContent }];

  // 4) Context history for mention/randomChime
  if (options.message && (type === "mention" || type === "randomChime")) {
    const fetched = await options.message.channel.messages.fetch({ limit: 10 });
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    const recent = Array.from(fetched.values())
      .filter(m => m.createdTimestamp >= cutoff)
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const window = type === "mention" ? recent.slice(0, -1) : recent.slice(-4, -1);
    const history = window.map(m => ({
      role:    m.author.id === options.message.client.user.id ? "assistant" : "user",
      content: m.content.slice(0, type === "mention" ? undefined : 500)
    }));
    messages.push(...history);
  }

  // 5) Few‐shot examples
  if (options.examples?.length) {
    const sampleList = options.examples
      .slice(0, 20)
      .map(s => `• ${s.replace(/\n/g, " ").trim()}`)
      .join("\n");
    messages.push({ role: "system", content: `Examples:\n${sampleList}` });
  }

  // 6) Inline image URLs for GPT-Vision
  if (options.attachments?.length) {
    const urls = options.attachments.map(a => a.url).join(" ");
    messages.push({
      role: "user",
      content: `Please analyze this image${options.attachments.length>1?"s":""}: ${urls}`
    });
  }

  // 7) Finally, the user’s text
  messages.push({ role: "user", content: userContent });

  // 8) Call OpenAI
  const resp = await openai.chat.completions.create({
    model:      options.model || "gpt-4o-mini",
    messages,
    max_tokens: options.maxTokens ?? (type === "mention" ? 150 : 80),
  });

  return resp.choices[0].message.content.trim();
}

module.exports = { generateReply };
