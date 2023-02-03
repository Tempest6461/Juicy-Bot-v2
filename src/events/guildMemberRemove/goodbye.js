module.exports = async (GuildMember, instance) => {
  const {
    guild: { id, channels, systemChannelId, name: guildName },
    user: { id: userId },
  } = GuildMember;
  // console.log(id)
  const channel =
    await instance.commandHandler.welcomeChannels.getWelcomeChannel(id);
  // console.log(channel)
  const joinLeaveChannel = channels.cache.get(channel ?? systemChannelId);

  try {
    joinLeaveChannel.send(
      `Don't let the door hit you on the way out, <@${userId}>! `
    );
  } catch (err) {
    console.log(`Error sending goodbye message in ${guildName}: ${err}`);
  }
};
