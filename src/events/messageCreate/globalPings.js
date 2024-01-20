const { Permissions, PermissionFlagsBits } = require('discord.js');

module.exports = (message) => {
        // Check if the message contains "@here" or "@everyone"
        if (message.content.includes('@here') || message.content.includes('@everyone')) {
            // Check if the user has the administrator permission
            if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                // Reply to the message notifying the user
                message.reply('Sorry, you are unable to use global pings. This is to prevent spam and abuse.');
            }
        };
};
