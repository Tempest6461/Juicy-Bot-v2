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
        const generalChannel =
          newMember.guild.channels.cache.find(channel => channel.name.includes('general')) ||
          newMember.guild.systemChannel;

        const count = await schizoCounterHandler.incrementNicknameChange(userId);
        const dynamicIntro = swapSchizoMessage();

        if (generalChannel) {
          generalChannel.send(
            `${dynamicIntro} He used to be ${oldNickname || 'none'}, now he's ${newNickname || 'none'}.\nMental Breakdowns: ${count}`
          );
        }
      } catch (error) {
        console.error('Error handling nickname change:', error);
      }
    }
  }
};