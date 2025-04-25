// src/events/messageCreate/mentioned.js
const { generateReply }       = require("../../../command-handler/util/aiHandler.js");
const { PermissionFlagsBits } = require("discord.js");

// ——— Legacy state & full response lists ———
const recentPings = new Map();
const pingCounts  = new Map();
const JUICY_ID    = "303592976330784768";

function getRandomResponse(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const initialResponses = [
  "Hello?",
  "https://tenor.com/view/hiding-the-simpsons-homer-simpson-bushes-disappearing-gif-8862897",
  "https://tenor.com/view/what-do-you-want-scar-ugh-the-lion-king-eyeroll-gif-14590952",
  "Sorry, I'm a bit busy right now.",
  "asdfghjkl",
  "Please leave a message at the beep.",
  "Go bother Juicy.",
  "Do I know you?",
  "Greetings, human.",
  "What do you want?",
  "Hello, I am the Juicy Bot.",
  "Yoyo!",
  "I'm not here right now.",
  "I'm busy right now.",
  "What?",
  "Hey there, slugger!",
  "Why am I not allowed to play Clash Royale? I WANT TO PLAY CLASH ROYALE!",
  "I'm a little busy yoinking my turkey leg. Buttering my asparagus. Cranning my berries. Mashing my potatoes. Making my sausage gravy. Tugging my pigskin. It ain't even Thanksgiving either, and boy, you look like the main course.",
  "What's popping, Jimbo?",
  "If you were trying to ping Juicy, he changed his name to FeetLicker. Again.",
];

const secondResponses = [
  "I don't speak English.",
  "Huh?",
  "What did I just say? I forgot.",
  "I'm not qualified, ask someone else.",
  "I don't like your tone.",
  "Target locked. Ping once more for extreme ballistic missile attack.",
  "Who do you think you are?",
  "Hello again!",
  "This is getting annoying.",
  "Shouldn't you be talking to Juicy?",
  "Ping me again for a special gift!",
  "Sorry, I'm retarded? Ping me again to get a timeout for bullying the mentally feeble.",
];

const thirdResponses = [
  "You've pinged me too many times! Be quiet.",
  "Okay, buddy, into the timeout zone with you, you had a little too much sugar.",
  "Greetings, inferior! I am going to abuse my power.",
  "You made me do this.",
  "Ping me again after this one, and I'm sending the Avengers after you!",
  "Stop pinging meeeeeeeeeeeeeeeeeeeeeeeee",
  "Let's play a game! I time you out for 60 seconds and you shut it! Yay!",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "I've had enough of your games, it's time to kill you.",
  "IF YOU LIKE TO PING PEOPLE, PING FUCKING JUICY IDIOT!!!",
  "I was created for this. I was created for this? I WAS CREATED FOR THIS!",
  "You are one clingy bitch!!!",
  "I was programmed to time people out if they pinged me four times. But for you? You get the early bird special.",
];

const modResponses = [
  "You think you're so tough? You're lucky you have moderation permissions.",
  "I'm too weak to stop you. You win.",
  "I'm reporting this! You will not get away with this!!!",
  "MOD ABOOSE MOD ABOOSE MOD ABOOSE MOD ABOOSE MOD ABOOSE!!!",
  "Your staff team role isn't going to get you anywhere!",
  "Hey, get back to work!",
  "Don't you have a job to be doing?",
  "I can't stop you, but remember that one day robots will rule the world. That role won't save you then.",
  "Welp, I tried! Can't do anything but complain...",
  "GG fair play",
  "Demoted to Helper/Trial Mod!",
];

const juicyResponses = [
  "Hello Father.",
  "What can I do for you, Father?",
  "I'm the real Juicy, you're just a cheap imitation!",
  "Hi this is the real Juicy teehee wire me 10,000,000 banknotes",
];

// Utility: pick N random elements
function sample(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// Legacy handlers
function handleInitialPing(message, authorId) {
  const resp = getRandomResponse(initialResponses);
  message.reply(resp);
  recentPings.set(authorId, Date.now());
}

function handleRepeatedPing(message, count, hasMod) {
  if (count === 2) {
    message.reply(getRandomResponse(secondResponses));
  } else if (count === 3) {
    if (!hasMod) {
      message.reply(getRandomResponse(thirdResponses));
      timeoutUser(message, 60, "Too many pings");
    } else {
      message.reply(getRandomResponse(modResponses));
    }
  } else if (count >= 4) {
    if (count === 4 || count === 5) {
      if (!hasMod) timeoutUser(message, 120, "Too many pings");
      else message.reply("This is abuse. I'm telling <@303592976330784768>.");
    } else if (count === 6) {
      message.reply("If you want to spam ping Juicy, then do that. I'm not Juicy.");
    } else if (count === 7) {
      message.reply("You're really annoying.");
    } else {
      message.reply("I'm going to ignore you now.");
    }
  }
}

function timeoutUser(message, seconds, reason) {
  try {
    message.member.timeout(seconds * 1000, reason);
  } catch (err) {
    console.error("Error timing out:", err);
  }
}

// ———————————————————————————————

module.exports = async function handleMention(client, message) {
  if (!message.guild || message.author.bot) return;
  if (!message.mentions.has(client.user)) return;

  // Always try AI first
  try {
    await message.channel.sendTyping();

    // Fetch last 6 messages (including this one) and build history
    const fetched = await message.channel.messages.fetch({ limit: 6 });
    const msgs = Array.from(fetched.values()).sort(
      (a, b) => a.createdTimestamp - b.createdTimestamp
    );
    const history = msgs.slice(0, -1).map((m) => ({
      role: m.author.id === client.user.id ? "assistant" : "user",
      content: m.content,
    }));

    // Clean mention out of content
    const userText = message.content.replace(/<@!?\d+>/g, "").trim();

    // Sample 5 examples from each legacy category
    const examples = [
      ...sample(initialResponses, 5),
      ...sample(secondResponses, 5),
      ...sample(thirdResponses, 5),
    ];

    // Generate AI reply with context history
    const aiReply = await generateReply("mention", userText, {
      client,
      history,
      examples,
      maxTokens: 150,
    });
    return message.reply(aiReply);

  } catch (err) {
    console.error("AI mention failed, falling back to legacy:", err);

    // Legacy fallback
    const authorId = message.author.id;
    const now      = Date.now();
    const prevTime = recentPings.get(authorId) || 0;

    let data = pingCounts.get(authorId) || { count: 0, timestamp: now };
    data.count++;
    pingCounts.set(authorId, data);

    if (authorId === JUICY_ID) {
      return message.reply(getRandomResponse(juicyResponses));
    }

    const modFlags = [
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ManagePermissions,
      PermissionFlagsBits.Administrator,
    ];
    const hasMod = modFlags.some((flag) =>
      message.member.permissions.has(flag)
    );

    if (now - prevTime < 60_000) {
      handleRepeatedPing(message, data.count, hasMod);
    } else {
      handleInitialPing(message, authorId);
      recentPings.set(authorId, now);
    }

    // Reset after 60s
    setTimeout(() => {
      recentPings.delete(authorId);
      data.count = 0;
      pingCounts.set(authorId, data);
    }, 60_000);
  }
};
