const welcomeMessages = require("../../../command-handler/util/welcomeMessages.js");

let usedMessages = [];

const swapWelcomeMessages = () => {
  if (welcomeMessages.length === 0) {
    welcomeMessages = usedMessages;
    usedMessages = [];
  }

  const selectedRandomMessageIndex = Math.floor(
    Math.random() * welcomeMessages.length
  );

  const [selectedRandomMessage] = welcomeMessages.splice(
    selectedRandomMessageIndex,
    1
  );
  usedMessages.push(selectedRandomMessage);

  return selectedRandomMessage;
};

module.exports = async (GuildMember, instance) => {
  const {
    guild: { id, channels, systemChannelId, name: guildName },
    user: { id: userId },
  } = GuildMember;

  const channel =
    await instance.commandHandler.welcomeChannels.getWelcomeChannel(id);
  const joinLeaveChannel = channels.cache.get(channel ?? systemChannelId);
  const selectedMessage = swapWelcomeMessages();

  try {
    joinLeaveChannel.send(
      `Welcome, <@${userId}> to ${guildName}! ` + selectedMessage
    );
  } catch (err) {
    console.log(`Error sending welcome message in ${guildName}: ${err}`);
  }
};
