const { PermissionFlagsBits } = require("discord.js");

const recentPings = new Map();
const pingCounts = new Map();

function handleMention(client, message) {
  if (message.mentions && message.mentions.has(client.user)) {
    const authorId = message.author.id;
    const currentTime = Date.now();
    const previousPingTime = recentPings.get(authorId);

    // Initialize count for the user if not present
    if (!pingCounts.has(authorId)) {
      pingCounts.set(authorId, { count: 2, timestamp: currentTime });
    }

    const userData = pingCounts.get(authorId);
    let pingCount = userData.count;

    if (previousPingTime && currentTime - previousPingTime < 60000) {
      userData.count++;

      if (pingCount === 3) {
        message.reply("Now you're just asking for it.");


      } else if (pingCount >= 4) {
        console.log("Executing else if block");

        if (!message.member.permissions.has(PermissionFlagsBits.kickMembers || PermissionFlagsBits.banMembers || PermissionFlagsBits.manageMessages || PermissionFlagsBits.managePermissions || PermissionFlagsBits.manageMessages || PermissionFlagsBits.Administrator)) {
          message.reply("You've pinged me too many times! Be quiet.");

          
            try {
              message.member.timeout( 60 * 1000, "You've pinged me too many times!");
              console.log("User timed out successfully");
            } catch (error) {
              console.error("Error timing out user:", error);
            }

        } else {
          console.log("User has moderation permissions, not timing out.");
          message.reply("You've pinged me too many times! But I can't time you out because you have moderation permissions.");
        }
      } else {
        console.log("Not executing else if block");
        message.reply(`Ping me again, see what happens.`);
      }

      
    } else {
      const randomNumber = Math.floor(Math.random() * 10) + 1;
      let response;

      switch (randomNumber) {
        case 1:
          response = "Hello! How can I assist you?";
          break;
        case 2:
          response =
            "https://tenor.com/view/hiding-the-simpsons-homer-simpson-bushes-disappearing-gif-8862897";
          break;
        case 3:
          response =
            "https://tenor.com/view/what-do-you-want-scar-ugh-the-lion-king-eyeroll-gif-14590952";
          break;
        case 4:
          response = "Sorry, I'm a bit busy right now.";
          break;
        case 5:
          response = "asdfghjkl";
          break;
        case 6:
          response = "Please leave a message at the beep.";
          break;
        case 7:
          response = "Go bother Juicy.";
          break;
        case 8:
          response = "I'm annoyed. Stop bothering me!";
          break;
        case 9:
          response = "I'm not in the mood to help right now.";
          break;
        case 10:
          response = "What do you want?";
          break;
        default:
          response = "Why are you pinging me?";
      }

      message.reply(response);
      recentPings.set(authorId, currentTime);

      setTimeout(() => {
        recentPings.delete(authorId);
        userData.count = 0; // Reset count after 60 seconds
      }, 60000);
    }

    // Update the count in the map
    pingCounts.set(authorId, userData);
  }
}

module.exports = handleMention;
