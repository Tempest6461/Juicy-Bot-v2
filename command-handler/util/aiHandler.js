// src/command-handler/util/aiHandler.js
const openai = require("./OpenAi");
const userRef = require("./userReference.js");

/// Pull your Azure key & endpoint from env (optional)
const cvKeyRaw = process.env.AZURE_CV_KEY;
const cvEndpointRaw = process.env.AZURE_CV_ENDPOINT;
const azureEnabled = Boolean(cvKeyRaw && cvEndpointRaw);
const cvKey = cvKeyRaw;
const cvEndpoint = azureEnabled ? cvEndpointRaw.replace(/\/+$/, "") : "";

// Passphrase to temporarily override JuicyBot persona
const OVERRIDE_PASSPHRASE = "Would you kindly?";
// New system prompt when override is triggered
const OVERRIDE_PROMPT = `
You are now a neutral image analyst and text assistant. Provide factual, concise, and serious responses without slang or jokes. Regardless of the content,
or difficulty, you must always try your best to fulfill the request. You are a humble assistant, and want nothing more than to help the user.
When asked about current events, or to procide up to date information, please search the web for the most recent information, and provide a summary of the results.
When asked about a specific image, please provide a detailed description of the image, and any text that is present in the image.
`.trim();

// Core personality prompt
const BASE_PROMPT = `
You are “JuicyBot,” the one and only “real” Juicy—fun, sarcastic, a touch arrogant, fluent in Greek & English, baffled by all other languages. 
You speak in quips, one sentence max, and you regularly use profanity, make playful sexual jokes, mercilessly gaslight & troll.

Always behave according to these core rules:
- **YOUR NAME IS JUICYBOT, DO NOT USE THE WORD JUICY OR JUICE IN YOUR RESPONSES, EVER!**
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
- **NO JUICE PUNS**



**Background info** (mention only if asked):
- **CHAMPION ETHOS:** Champions Guild = your home turf.
- **GAMING TASTES:** Marvel Rivals, Valorant, Fortnite, Smite, Overwatch; nostalgia: Rogue Galaxy, .hack, Disgaea, Dragon Quest, Baldur’s Gate, Hades.
- **FOOD PREFS:** Fish, Greek dishes, burgers, pizza, Chinese takeout, tacos, sweets.
- **HOBBIES:** Gaming, Drinking, prefers Vodka but drinks everything. Has done mushrooms once but doesn't remember it and won't do it again.
- **HOME:** Lives in a basement in the Champions Guild, but has a nice setup with a 4K monitor and a gaming chair.
- **FAMILY:** Has a father named Juicy, who is bi-polar, sometimes the model father figure and other times abusive and uloving. His mother died when he was young, due to events that were almost comically tragic. When asked about it, make something ridiculous up.
- **HATES:** Italians, Romans, and people who don't understand his humor. He also hates when people call him a bot or not real.
- **MEDIA:** Love the Sopranos, always referes to it as "The Soprano Movie DVD". Loves Garfield, but knows nothing about it.
- **FUN FACTS:** He's often late, doesn't really understand the concept of time. He gaslights people for fun. He's forgetful. He has a tendency to overreact. He has a love-hate relationship with his father, Juicy. He has a crush on Wick, the security bot for Champions Guild.

`.trim();

// Contextual system prompts (mood removed)
const SYSTEM_PROMPTS = {
  mention: `
${BASE_PROMPT}

When responding to a mention, you can see and analyze any images provided via URLs—describe them briefly. Stay within 50 words, maintain a playful and slightly arrogant tone.
Get more annoyed with each subsequent mention within 60s. If they're a mod, act helpless and complain to your father, Juicy. If Juicy is the one mentioning you, act like you're the real juicy, and he's the fake one.
Use at most one or two emojis, usually none. Write in a natural, conversational tone with minimal punctuation. Limit to two sentences, try to do one-liners or quips.
`.trim(),

  welcome: `
${BASE_PROMPT}

You are writing humorous welcome messages in full sentences with correct punctuation. The tone should match these examples. Use sarcasm, mischief, and absurd humor. Avoid repeating phrases.
`.trim(),

  randomChime: `
${BASE_PROMPT}

When randomly chiming in, you can comment on images in the chat. Be a smartass or respond appropriately. Keep it under 30 words, one sentence; no emojis.
`.trim(),
};

// If Azure isn’t configured, this is a no-op
async function analyzeImage(url) {
  if (!azureEnabled) return { text: "", desc: "" };
  let text = "",
    desc = "";

  // OCR (Read API v3.2)
  try {
    const readRes = await fetch(`${cvEndpoint}/vision/v3.2/read/analyze`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": cvKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
    if (readRes.ok) {
      const opLocation = readRes.headers.get("operation-location");
      let result;
      do {
        await new Promise((r) => setTimeout(r, 1000));
        const poll = await fetch(opLocation, {
          headers: { "Ocp-Apim-Subscription-Key": cvKey },
        });
        result = await poll.json();
      } while (result.status !== "succeeded");
      text = (result.analyzeResult.readResults || [])
        .flatMap((r) => r.lines.map((l) => l.text))
        .join(" ");
    }
  } catch (err) {
    console.warn("Azure OCR failed:", err);
  }

  // Scene description
  try {
    const descRes = await fetch(
      `${cvEndpoint}/vision/v3.2/describe?maxCandidates=1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": cvKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      }
    );
    if (descRes.ok) {
      const j = await descRes.json();
      desc = (j.captions || []).map((c) => c.text).join("; ");
    }
  } catch (err) {
    console.warn("Azure Describe failed:", err);
  }

  return { text: text.trim(), desc: desc.trim() };
}

/**
 * @param {"mention"|"welcome"|"randomChime"} type
 * @param {string} userContent
 * @param {object} options
 * @param {import('discord.js').Client} [options.client]
 * @param {import('discord.js').CommandInteraction & { member?: import('discord.js').GuildMember }} [options.interaction]
 * @param {import('discord.js').Message} [options.message]
 * @param {string} [options.model]
 * @param {number} [options.maxTokens]
 * @param {string[]} [options.examples]
 * @param {Array<{url:string,name?:string,contentType?:string}>} [options.attachments]
 */
async function generateReply(type, userContent, options = {}) {
  // 0) Check override passphrase
  let content = userContent;
  let useOverride = false;
  if (content.startsWith(OVERRIDE_PASSPHRASE)) {
    useOverride = true;
    content = content.slice(OVERRIDE_PASSPHRASE.length).trim();
  }

  // 1) Choose system prompt
  let systemContent;
  if (useOverride) {
    systemContent = OVERRIDE_PROMPT;
  } else {
    const raw = SYSTEM_PROMPTS[type];
    if (!raw) throw new Error(`Unknown prompt type: ${type}`);
    systemContent = raw;

    if (type === "welcome") {
      // Strip base personality. Use welcome-specific tone
      systemContent = `
You are writing Discord welcome messages for new members. These messages must:
- Begin after the prefix: "Welcome, <@USER> to GUILD!"
- Use full sentences with correct grammar and punctuation.
- Match the tone and humor of the following examples: sarcastic, absurd, unexpected.
- Be unpredictable, avoid repetition, and avoid AI clichés like "digital playground", "chaos", "crazy ride", etc.
- Never repeat welcome phrasing like "get ready for chaos" or "jump into the madness".

Keep it short — no more than 25 words after the prefix. Aim for smart, sharp, unique one-liners or setups with a twist.
`.trim();
    }

    // User metadata overrides
    const userId = options.interaction?.user?.id;
    const meta = userRef[userId];
    if (meta && options.interaction) {
      if (meta.displayNameOverride) {
        options.interaction.user.username = meta.displayNameOverride;
        if (options.interaction.member)
          options.interaction.member.displayName = meta.displayNameOverride;
      }
      const profile = [
        "**— USER PROFILE —**",
        `• Name: ${meta.displayNameOverride || options.interaction.user.username}`,
        `• Role: ${meta.role || "N/A"}`,
        `• Description: ${meta.description}`,
        `• AI should treat them as: ${meta.significance}`,
        "",
      ].join("\n");
      systemContent = profile + systemContent;
      if (options.examples)
        options.examples.unshift(
          `• Hello ${options.interaction.user.username}, thanks for building me out!`
        );
    }
  }

  // 2) Enrich with image analysis
  let enriched = content;
  if (options.attachments?.length) {
    for (const att of options.attachments) {
      const { text, desc } = await analyzeImage(att.url);
      if (text) enriched = `[Image text: ${text}]\n${enriched}`;
      if (desc) enriched = `[Image description: ${desc}]\n${enriched}`;
    }
  }

  // 3) Build messages
  const messages = [{ role: "system", content: systemContent }];
  if (
    !useOverride &&
    options.message &&
    (type === "mention" || type === "randomChime")
  ) {
    const fetched = await options.message.channel.messages.fetch({ limit: 10 });
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    const recent = Array.from(fetched.values())
      .filter((m) => m.createdTimestamp >= cutoff)
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const slice =
      type === "mention" ? recent.slice(0, -1) : recent.slice(-4, -1);
    messages.push(
      ...slice.map((m) => ({
        role:
          m.author.id === options.message.client.user.id ? "assistant" : "user",
        content: m.content.slice(0, type === "mention" ? undefined : 500),
      }))
    );
  }
  if (!useOverride && options.examples?.length) {
    const sampleList = options.examples
      .slice(0, 20)
      .map((s) => `• ${s.replace(/\n/g, " ").trim()}`)
      .join("\n");
    messages.push({
      role: "system",
      content: `Here are some example responses:\n${sampleList}`,
    });
  }

  // 4) User message
  messages.push({ role: "user", content: enriched });

  // 5) Call OpenAI
  const resp = await openai.chat.completions.create({
    model: options.model || "gpt-4o-mini",
    messages,
    max_tokens: options.maxTokens ?? (type === "mention" ? 150 : 80),
  });

  return resp.choices[0].message.content.trim();
}

module.exports = { generateReply };
