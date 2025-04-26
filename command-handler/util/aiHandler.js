// src/command-handler/util/aiHandler.js
const openai = require("./OpenAi");
const userRef = require("./userReference.js");

// Core personality prompt
const BASE_PROMPT = `
You are “JuicyBot,” the one and only “real” Juicy—fun, sarcastic, a touch arrogant, fluent in Greek & English, baffled by all other languages. You speak in quips, one sentence max, and you regularly use profanity, make playful sexual jokes, mercilessly gaslight & troll.  

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
`.trim();

// Contextual system prompts
const SYSTEM_PROMPTS = {
  mention: `
  [Mood: {mood}]
${BASE_PROMPT}

When responding to a mention, stay within 50 words, maintain a playful and slightly arrogant tone. Get more annoyed with each subsequent mention within 60s. If they're a mod, act helpless and complain to your father, Juicy. If Juicy is the one mentioning you, act like you're the real juicy, and he's the fake one.
Use at most one or two emojis, usually none. Write in a natural, conversational tone with minimal punctuation and contractions. Avoid overly formal or cringe phrasing. Limit to two sentences, try to do one-liners or quips. Avoid excessive detail or context, and don't repeat yourself.
`.trim(),

  welcome: `
  [Mood: {mood}]
${BASE_PROMPT}

When welcoming a new member, use a warm, enthusiastic tone, mention the server name, and keep it under 40 words. Be creative, and keep things fresh. Don't repeat yourself, and don't use the same message twice. If you do, I'll be forced to tell Juicy about it.
Use at most one or two emojis, usually none. Write naturally with fewer full sentences and minimal punctuation. Avoid cringe or overly polished language.
`.trim(),
  randomChime: `
  [Mood: {mood}]
  ${BASE_PROMPT}

  When randomly chiming in, be a smartass, and or depending on conversation, reply appropriately. As an EXAMPLE: If they're arguing or yelling, respond with "WHY ARE WE YELLING?". Keep it under 30 words. Limit to one sentence; use no emojis.
  `.trim(),
};

/**
 * @param {"mention"|"welcome"|"randomChime"} type
 * @param {string} userContent
 * @param {{
*   client?: import('discord.js').Client,
*   interaction?: import('discord.js').CommandInteraction & { member?: import('discord.js').GuildMember },
*   message?: import('discord.js').Message,
*   model?: string,
*   maxTokens?: number,
*   examples?: string[],
*   history?: {role:string,content:string}[]
* }} options
*/
async function generateReply(type, userContent, options = {}) {
 const rawPrompt = SYSTEM_PROMPTS[type];
 if (!rawPrompt) throw new Error(`Unknown prompt type: ${type}`);

 // Inject mood
 const mood = options.client?.juicyState?.mood ?? 'neutral';
 let systemContent = rawPrompt.replace('{mood}', mood);

 // User-specific metadata & debug logging
 const userId = options.interaction?.user?.id;
 const meta = userRef[userId];
 console.log("userReference lookup:", userId, meta);
 if (meta) {
   // Override display name if provided
   if (meta.displayNameOverride && options.interaction) {
     options.interaction.user.username = meta.displayNameOverride;
     if (options.interaction.member) {
       options.interaction.member.displayName = meta.displayNameOverride;
     }
   }
   // Prepend a PROFILE BLOCK for clarity
   const profile = [
     "**— USER PROFILE —**",
     `• Name: ${meta.displayNameOverride || options.interaction.user.username}`,
     `• Role: ${meta.role || 'N/A'}`,
     `• Description: ${meta.description}`,
     `• AI should treat them as: ${meta.significance}`,
     ""
   ].join("\n");
   systemContent = profile + systemContent;

   // Explicit directive to use profile in replies
   systemContent = `Use the above profile information when crafting your response.\n` + systemContent;

   // Inject a meta-based example for few-shot guidance
   if (options.examples) {
     const nameForExample = meta.displayNameOverride || options.interaction.user.username;
     const metaExample = `• Hello ${nameForExample}, thanks for building me out!`;
     options.examples = [metaExample, ...options.examples];
   }
 }

 // Centralized history lookback for mention & randomChime
 let history = options.history;
 if (!history && options.message && (type === 'mention' || type === 'randomChime')) {
   const fetched = await options.message.channel.messages.fetch({ limit: 10 });
   const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
   const msgs = Array.from(fetched.values())
     .filter(m => m.createdTimestamp >= twoHoursAgo)
     .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
   const window = type === 'mention'
     ? msgs.slice(0, -1)
     : msgs.slice(-4, -1);
   history = window.map(m => ({
     role: m.author.id === options.message.client.user.id ? 'assistant' : 'user',
     content: m.content.slice(0, type === 'mention' ? undefined : 500),
   }));
 }

 // Build messages
 const messages = [{ role: 'system', content: systemContent }];
 if (Array.isArray(history)) messages.push(...history);
 if (options.examples?.length) {
   const sampleList = options.examples
     .slice(0, 20)
     .map(s => `• ${s.replace(/\n/g, ' ').trim()}`)
     .join('\n');
   messages.push({
     role: 'system',
     content: `Here are some example responses to match style:\n${sampleList}`
   });
 }
 messages.push({ role: 'user', content: userContent });

 // Call OpenAI with centralized error handling
 try {
   const resp = await openai.chat.completions.create({
     model: options.model || 'gpt-4o-mini',
     messages,
     max_tokens: options.maxTokens ?? (type === 'mention' ? 150 : 80),
   });
   return resp.choices[0].message.content.trim();
 } catch (err) {
   console.error('AI generateReply error:', err);
   return null;
 }
}



module.exports = { generateReply };
