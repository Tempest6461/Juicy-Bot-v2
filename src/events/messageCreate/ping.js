module.exports = (message) => {
  if (
    message.content === "ping" ||
    message.content === "Ping" ||
    message.content === "PING"
  ) {
    message.channel.send("Pong!");
  }
};
