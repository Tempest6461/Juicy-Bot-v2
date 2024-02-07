const SchizoCounterHandler = require('../../../command-handler/command-handler/SchizoCounter');

const schizoCounterHandler = new SchizoCounterHandler();

module.exports = async (oldMember, newMember) => {
    // const userId = '303592976330784768';    // Juicy's user ID
    const userId = '131562657680457729';    // Temps's user ID

    const { id: memberId } = newMember.user;

    if (memberId === userId) {
        const oldNickname = oldMember.nickname;
        const newNickname = newMember.nickname;

        console.log(`Old Nickname: ${oldNickname}`);
        console.log(`New Nickname: ${newNickname}`);

        if (oldNickname !== newNickname) {
            try {
                // Record the nickname change in the database
                await schizoCounterHandler.recordNicknameChange(newMember.user.id, oldNickname, newNickname);
            
                console.log(`User ${newMember.user.tag} changed their nickname from ${oldNickname || 'none'} to ${newNickname || 'none'}`);
                            
                const generalChannel = newMember.guild.channels.cache.find(channel => channel.name.includes('general')) || newMember.guild.systemChannel;
            
                if (generalChannel) {
                    // Get the count of nickname changes from the database
                    const nicknameChangeCount = await schizoCounterHandler.getNicknameChangeCount(newMember.user.id);
                    generalChannel.send(`Juicy is having another identity crisis. They changed their nickname from ${oldNickname || 'none'} to ${newNickname || 'none'}. 
Schizo counter: ${nicknameChangeCount}`);
                } else {
                    console.log(`No channel found with the word "general" in its name and no system messages channel.`);
                }
            } catch (error) {
                if (error.name === 'CastError') {
                    console.error('Error recording nickname change:', 'Invalid data format.');
                } else {
                    console.error('Error recording nickname change:', error);
                }
            }
        }
    }
}
