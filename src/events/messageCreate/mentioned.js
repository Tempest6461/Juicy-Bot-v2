const { PermissionFlagsBits } = require("discord.js");

const recentPings = new Map();
const pingCounts = new Map();

function handleMention(client, message) {
  if (!message.mentions || !message.mentions.has(client.user)) return;

  const authorId = message.author.id;
  const currentTime = Date.now();
  const previousPingTime = recentPings.get(authorId);

  let userData = pingCounts.get(authorId);
  if (!userData) {
    userData = { count: 2, timestamp: currentTime };
    pingCounts.set(authorId, userData);
  }

  let pingCount = userData.count;

  const hasModerationPermissions = message.member.permissions.has(
    PermissionFlagsBits.kickMembers ||
      PermissionFlagsBits.banMembers ||
      PermissionFlagsBits.manageMessages ||
      PermissionFlagsBits.managePermissions ||
      PermissionFlagsBits.Administrator
  );

  if (previousPingTime && currentTime - previousPingTime < 60000) {
    userData.count++;
    console.log(`Ping count: ${pingCount}`);

    if (pingCount === 2) {
      // console.log("Handling second ping");
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
      ];
      const secondResponse =
        secondResponses[Math.floor(Math.random() * secondResponses.length)];
      message.reply(secondResponse);
    } else if (pingCount === 3) {
      // console.log("Handling third ping");
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

      if (!hasModerationPermissions) {
        const thirdResponse =
          thirdResponses[Math.floor(Math.random() * thirdResponses.length)];
        message.reply(thirdResponse);
        try {
          message.member.timeout(60 * 1000, "You've pinged me too many times!");
        } catch (error) {
          console.error("Error timing out user:", error);
        }
      } else {
        // console.log("Handling mod response to third");
        const modResponse =
          modResponses[Math.floor(Math.random() * modResponses.length)];
        message.reply(modResponse);
      }
    } else if (pingCount === 4 || pingCount === 5) {
      // console.log("Handling fourth ping");
      if (!hasModerationPermissions) {
        try {
          message.member.timeout(
            120 * 1000,
            "You've pinged me too many times!"
          );
        } catch (error) {
          console.error("Error timing out user:", error);
        }
      } else {
        message.reply("This is abuse. I'm telling <@303592976330784768>."); // Juicy
      }
    } else if (pingCount === 6) {
      // console.log("Handling sixth ping");
      message.reply(
        "If you want to spam ping Juicy, then do that. I'm not Juicy."
      );
    } else if (pingCount === 7) {
      // console.log("Handling seventh ping");
      message.reply("You're really annoying.");
    } else if (pingCount === 8) {
      // console.log("Handling eighth & final ping");
      message.reply("I'm going to ignore you now.");
    }
  } else {
    // console.log("Handling initial ping");
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
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    message.reply(response);
    recentPings.set(authorId, currentTime);
    setTimeout(() => {
      // console.log(`Deleting recent ping entries for user ${authorId}`);
      recentPings.delete(authorId);
      userData.count = 0; // Reset count after 60 seconds
    }, 60000);
  }

  // Update the count in the map
  pingCounts.set(authorId, userData);
}

module.exports = handleMention;
