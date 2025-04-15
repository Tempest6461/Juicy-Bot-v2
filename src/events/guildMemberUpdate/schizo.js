const SchizoCounterHandler = require('../../../command-handler/command-handler/SchizoCounter');
const schizoCounterHandler = new SchizoCounterHandler();

module.exports = async (oldMember, newMember) => {
    // const userId = '303592976330784768';  // My ID for debugging purposes
    const userId = '303592976330784768'; // Juicy's user ID
    const { id: memberId } = newMember.user;

    if (memberId === userId) {
        const oldNickname = oldMember.nickname;
        const newNickname = newMember.nickname;

        if (oldNickname !== newNickname) {
            try {
                await schizoCounterHandler.recordNicknameChange(userId, oldNickname, newNickname);

                const generalChannel = newMember.guild.channels.cache.find(channel => channel.name.includes('general')) || newMember.guild.systemChannel;

                if (generalChannel) {
                    const nicknameChangeCount = await schizoCounterHandler.getNicknameChangeCount(userId);
                    generalChannel.send(`Juicy is having another identity crisis. They changed their nickname from ${oldNickname || 'none'} to ${newNickname || 'none'}.\nSchizo counter: ${nicknameChangeCount}`);
                } else {
                    console.log(`No "general" channel or system channel found.`);
                }
            } catch (error) {
                console.error('Error recording nickname change:', error);
            }
        }
    }
};
