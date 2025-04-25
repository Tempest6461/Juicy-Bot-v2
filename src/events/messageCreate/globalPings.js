const { PermissionFlagsBits, MessageFlagsBits } = require('discord.js');

const recentAttempts = new Map();
const pingAttempts = new Map();

module.exports = (message) => {
    // Ignore DMs or missing guild member
    if (!message.guild || !message.member) return;

    // Check if the user has the administrator permission
    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return;
    }

    // Check if the message contains "@here" or "@everyone"
    if (message.content.includes('@here') || message.content.includes('@everyone')) {
        const authorId = message.author.id;
        const currentTime = Date.now();
        const previousPingTime = recentAttempts.get(authorId);

        // Initialize count for the user if not present
        if (!pingAttempts.has(authorId)) {
            pingAttempts.set(authorId, { count: 1, timestamp: currentTime });
        }

        const userData = pingAttempts.get(authorId);
        let pingCount = userData.count;

        if (previousPingTime && currentTime - previousPingTime < 60000) {
            userData.count++;

            if (pingCount >= 1) {
                message.delete();
                message.reply("Sorry, you are unable to use global pings. This is to prevent spam and abuse.");

            } else if (pingCount >= 2) {
                message.delete();
                message.reply("You don't have the power to use global pings.");

            } else if (pingCount >= 3) {
                message.delete();
                message.reply("What did I just say?");

            } else if (pingCount >= 4) {
                message.delete();
                message.reply("You're really trying my patience.");

            } else if (pingCount >= 5) {
                message.delete();
                message.reply("This is literally the definition of insanity.");

            } else if (pingCount >= 6) {
                message.delete();
                message.reply("You're going to get yourself banned, go sit in the corner.");

                try {
                    message.member.timeout(60 * 1000, "You basically asked for it. You've been timed out for 60 seconds");
                } catch (error) {
                    console.error("Error timing out user:", error);
                }
            }
        } else {
            recentAttempts.set(authorId, currentTime);

            setTimeout(() => {
                recentAttempts.delete(authorId);
                userData.count = 0; // Reset count after 60 seconds
            }, 60000);
        }

        // Update the count in the map
        pingAttempts.set(authorId, userData);
    }
};
