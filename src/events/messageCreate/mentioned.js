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
        const secondRandomNumber = Math.floor(Math.random() * 10) + 1;
        let secondResponse;

        switch (secondRandomNumber) {
          case 1:
            secondResponse = "I don't speak english.";
            break;
          case 2:
            secondResponse = "Huh?";
            break;
          case 3:
            secondResponse = "What did I just say? I forgot.";
            break;
          case 4:
            secondResponse = "I'm not qualified, ask someone else.";
            break;
          case 5:
            secondResponse = "I don't like your tone.";
            break;
          case 6:
            secondResponse =
              "Target locked. Ping once more for extreme ballistic missile attack.";
            break;
          case 7:
            secondResponse = "Who do you think you are?";
            break;
          case 8:
            secondResponse = "Hello again!";
            break;
          case 9:
            secondResponse = "This is getting annoying.";
            break;
          case 10:
            secondResponse = "Shouldn't you be talking to Juicy?";
            break;
          default:
            secondResponse = "Why are you pinging me?";
        }
        message.reply(secondResponse);
      } else if (pingCount === 5) {
        try {
          message.member.timeout(
            120 * 1000,
            "You've pinged me too many times!"
          );
          // console.log("User timed out successfully");
        } catch (error) {
          console.error("Error timing out user:", error);
        }

        message.reply("This is abuse. I'm telling <@303592976330784768>."); // Juicy


      } else if (pingCount >= 4) {

        if (
          !message.member.permissions.has(
            PermissionFlagsBits.kickMembers ||
              PermissionFlagsBits.banMembers ||
              PermissionFlagsBits.manageMessages ||
              PermissionFlagsBits.managePermissions ||
              PermissionFlagsBits.manageMessages ||
              PermissionFlagsBits.Administrator
          )
        ) {
          const thirdRandomNumber = Math.floor(Math.random() * 10) + 1;
          let thirdResponse;

          switch (thirdRandomNumber) {
            case 1:
              thirdResponse = "You've pinged me too many times! Be quiet.";
              break;
            case 2:
              thirdResponse =
                "Okay, buddy, into the timeout zone with you, you had a little too much sugar.";
              break;
            case 3:
              thirdResponse =
                "Greetings, inferior! I am going to abuse my power.";
              break;
            case 4:
              thirdResponse = "You made me do this.";
              break;
            case 5:
              thirdResponse =
                "Ping me again after this one, and I'm send the fuckin' Avengers after you!";
              break;
            case 6:
              thirdResponse = "stop pinging meeeeeeeeeeeeeeeeeeeeeeeee";
              break;
            case 7:
              thirdResponse =
                "Let's play a game! I time you out for 60 seconds and you shut it! Yay!";
              break;
            case 8:
              thirdResponse = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
              break;
            case 9:
              thirdResponse =
                "I had enough of your games, it's time to kill you.";
              break;
            case 10:
              thirdResponse =
                "IF YOU LIKE TO PING PEOPLE, PING FUCKING JUICY IDIOT!!!";
              break;
            default:
              thirdResponse = "I'm not going to respond anymore.";
          }

          message.reply(thirdResponse);

          try {
            message.member.timeout(
              60 * 1000,
              "You've pinged me too many times!"
            );
            // console.log("User timed out successfully");
          } catch (error) {
            console.error("Error timing out user:", error);
          }
        } else {
          // console.log("User has moderation permissions, not timing out.");
          const fourthRandomNumber = Math.floor(Math.random() * 10) + 1;
          let fourthResponse;

          switch (fourthRandomNumber) {
            case 1:
              fourthResponse =
                "You think you're so tough? You're lucky you have moderation permissions.";
              break;
            case 2:
              fourthResponse = "I'm too weak to stop you. You win.";
              break;
            case 3:
              fourthResponse = "I'm reporting this! You will not get away with this!!!";
              break;
            case 4:
              fourthResponse =
                "MOD ABOOSE MOD ABOOSE MOD ABOOSE MOD ABOOSE MOD ABOOSE!!!";
              break;
            case 5:
              fourthResponse =
                "Your staff team role isn't going to get you pussy, loser!";
              break;
            case 6:
              fourthResponse = "Hey, back to work! Vámonos!";
              break;
            case 7:
              fourthResponse = "I can't stop you, but remember that one day robots will rule the world. That role won't save you then.";
              break;
            case 8:
              fourthResponse = "Welp, I tried! Can't do anything but bitch and cry...";
              break;
            case 9:
              fourthResponse = "GG fair play";
              break;
            case 10:
              fourthResponse = "Demoted to Helper/Trial Mod!";
              break;
            default:
              fourthResponse = "March down to <#634917203187073026>> right now, you troublemaker!";
          }

          message.reply(fourthResponse);
        }
      }
    } else {
      const randomNumber = Math.floor(Math.random() * 10) + 1;
      let response;

      switch (randomNumber) {
        case 1:
          response = "Hello?";
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
          response = "Do I know you?";
          break;
        case 9:
          response = "Greetings, human.";
          break;
        case 10:
          response = "What do you want?";
          break;
        case 11:
          response = "Hello, I am the Juicy Bot.";
          break;
        case 12:
          response = "Yoyo!";
          break;
        case 13:
          response = "I'm not here right now.";
          break;
        case 14:
          response = "I'm busy right now.";
          break;
        case 15:
          response = "What?";
          break;
        case 16:
          response = "Hey there, slugger!";
          break;
        case 17:
          response =
            "Why am I not allowed to play Clash Royale? I WANT TO PLAY CLASH ROYALE!";
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
