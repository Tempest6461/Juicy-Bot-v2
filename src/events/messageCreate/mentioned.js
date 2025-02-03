const { PermissionFlagsBits } = require("discord.js");

const recentPings = new Map();
const pingCounts = new Map();
const JUICY_ID = "303592976330784768"; // Juicy's Discord ID

function getRandomResponse(responses) {
  return responses[Math.floor(Math.random() * responses.length)];
}

function handleMention(client, message) {
  if (!message.mentions || !message.mentions.has(client.user)) return;

  const authorId = message.author.id;
  const currentTime = Date.now();
  const previousPingTime = recentPings.get(authorId);

  let userData = pingCounts.get(authorId) || {
    count: 0,
    timestamp: currentTime,
  };
  userData.count++;
  pingCounts.set(authorId, userData);

  const pingCount = userData.count;
  const hasModerationPermissions = message.member.permissions.has(
    PermissionFlagsBits.KickMembers ||
      PermissionFlagsBits.BanMembers ||
      PermissionFlagsBits.ManageMessages ||
      PermissionFlagsBits.ManagePermissions ||
      PermissionFlagsBits.Administrator
  );

  if (authorId === JUICY_ID) {
    // Special handling for Juicy
    const juicyResponses = [
      "Hello Father.",
      "What can I do for you, Father?",
      "I'm the real Juicy, you're just a cheap imitation!",
      "Hi this is the real Juicy teehee wire me 10,000,000 banknotes",
    ];
    message.reply(getRandomResponse(juicyResponses));
    return;
  }

  if (previousPingTime && currentTime - previousPingTime < 60000) {
    handleRepeatedPing(message, pingCount, hasModerationPermissions);
  } else {
    handleInitialPing(message, authorId);
  }

  // Reset recent ping data after 60 seconds
  setTimeout(() => {
    recentPings.delete(authorId);
    userData.count = 0;
    pingCounts.set(authorId, userData);
  }, 60000);
}

function handleInitialPing(message, authorId) {
  const responses = [
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

  const response = getRandomResponse(responses);
  message.reply(response);
  recentPings.set(authorId, Date.now());
}

function handleRepeatedPing(message, pingCount, hasModerationPermissions) {
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

  if (pingCount === 2) {
    message.reply(getRandomResponse(secondResponses));
  } else if (pingCount === 3) {
    if (!hasModerationPermissions) {
      message.reply(getRandomResponse(thirdResponses));
      timeoutUser(message, 60, "You've pinged me too many times!");
    } else {
      message.reply(getRandomResponse(modResponses));
    }
  } else if (pingCount >= 4) {
    handleHighPingCount(message, pingCount, hasModerationPermissions);
  }
}

function handleHighPingCount(message, pingCount, hasModerationPermissions) {
  if (pingCount === 4 || pingCount === 5) {
    if (!hasModerationPermissions) {
      timeoutUser(message, 120, "You've pinged me too many times!");
    } else {
      message.reply("This is abuse. I'm telling <@303592976330784768>.");
    }
  } else if (pingCount === 6) {
    message.reply(
      "If you want to spam ping Juicy, then do that. I'm not Juicy."
    );
  } else if (pingCount === 7) {
    message.reply("You're really annoying.");
  } else if (pingCount === 8) {
    message.reply("I'm going to ignore you now.");
  }
}

function timeoutUser(message, duration, reason) {
  try {
    message.member.timeout(duration * 1000, reason);
  } catch (error) {
    console.error("Error timing out user:", error);
  }
}

module.exports = handleMention;
