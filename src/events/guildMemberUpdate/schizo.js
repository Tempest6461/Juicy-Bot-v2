const SchizoCounterHandler = require('../../../command-handler/command-handler/SchizoCounter');
const schizoMessages = require("../../../command-handler/util/schizoMessages");

let availableMessages = [...schizoMessages];
let usedMessages = [];

const swapSchizoMessage = () => {
  if (availableMessages.length === 0) {
    availableMessages = [...usedMessages];
    usedMessages = [];
  }

  for (let i = availableMessages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableMessages[i], availableMessages[j]] = [availableMessages[j], availableMessages[i]];
  }

  const selectedMessage = availableMessages.pop();
  usedMessages.push(selectedMessage);

  return selectedMessage;
};

const schizoCounterHandler = new SchizoCounterHandler();

module.exports = async (oldMember, newMember) => {
  const userId = '303592976330784768'; // Juicy's user ID
  const { id: memberId } = newMember.user;

  if (memberId === userId) {
    const oldNickname = oldMember.nickname;
    const newNickname = newMember.nickname;

    if (oldNickname !== newNickname) {
      try {
        await schizoCounterHandler.recordNicknameChange(userId, oldNickname, newNickname);

        const generalChannel =
          newMember.guild.channels.cache.find(channel => channel.name.includes('general')) ||
          newMember.guild.systemChannel;

        if (generalChannel) {
          const nicknameChangeCount = await schizoCounterHandler.getNicknameChangeCount(userId);
          const dynamicIntro = swapSchizoMessage();

          generalChannel.send(
            `${dynamicIntro} He used to be ${oldNickname || 'none'}, now he's ${newNickname || 'none'}.\nMental Breakdowns: ${nicknameChangeCount}`
          );
        } else {
          console.log(`No "general" channel or system channel found.`);
        }
      } catch (error) {
        console.error('Error recording nickname change:', error);
      }
    }
  }
};
