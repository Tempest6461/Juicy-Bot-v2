const Discord = require('discord.js');

let nicknameChangeCounter = 0;
let nicknameChangeTimestamps = [];
let botStartTime = Date.now();

module.exports = (oldMember, newMember) => {
    if (newMember.user.id === '303592976330784768') {
        let oldNickname = oldMember.nickname;
        let newNickname = newMember.nickname;

        console.log(`Old Nickname: ${oldNickname}`);
        console.log(`New Nickname: ${newNickname}`);

        if (oldNickname !== newNickname) {
            nicknameChangeCounter++;
            nicknameChangeTimestamps.push(Date.now());
            console.log(`User ${newMember.user.tag} changed their nickname from ${oldNickname || 'none'} to ${newNickname || 'none'}`);
            console.log(`Nickname change count: ${nicknameChangeCounter}`);
            // You can perform additional actions here, like sending a message, logging, etc.
            
            const generalChannel = newMember.guild.channels.cache.find(channel => channel.name.includes('general'));
            const systemChannel = newMember.guild.systemChannel;

            const uptime = Math.floor((Date.now() - botStartTime) / (1000 * 60 * 60)); // Calculate uptime in hours

            if (generalChannel) {
                generalChannel.send(`<@303592976330784768> is having another identity crisis. They changed their nickname from ${oldNickname || 'none'} to ${newNickname || 'none'}.`);
                generalChannel.send(`Juicy has changed their nickname ${nicknameChangeCounter} time(s) since the bot started, which has been running for ${uptime} hours.`);
            } else if (systemChannel) {
                systemChannel.send(`<@303592976330784768> is having another identity crisis. They changed their nickname from ${oldNickname || 'none'} to ${newNickname || 'none'}.`);
                systemChannel.send(`Juicy has changed their nickname ${nicknameChangeCounter} time(s) since the bot started, which has been running for ${uptime} hours.`);
            } else {
                console.log(`No channel found with the word "general" in its name and no system messages channel.`);
            }
        }
    }
}