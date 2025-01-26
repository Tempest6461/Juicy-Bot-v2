const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "mc-alerts",
  category: "Utility",
  description: "Monitor the status of a Minecraft server and alert on status changes.",
  
  minArgs: 3, // Minimum of 3 arguments now (server IP, interval, and channel)
  correctSyntax: "Correct syntax: {PREFIX}mc-alerts <server IP> <check interval in minutes> <channel>",
  expectedArgs: "<server IP> <check interval in minutes> <channel>",

  type: "BOTH",
  testOnly: true,
  reply: true,
  guildOnly: true,

  permissions: [PermissionFlagsBits.SendMessages],

  callback: async ({ args, client }) => {
    const serverIP = args[0];
    const checkIntervalInMinutes = parseInt(args[1]); // Interval in minutes
    const channelId = args[2]; // Channel is now required

    // Validate the check interval in minutes
    if (isNaN(checkIntervalInMinutes) || checkIntervalInMinutes <= 0) {
      return {
        content: "Please provide a valid check interval in minutes.",
        ephemeral: true,
      };
    }

    // Convert check interval from minutes to milliseconds
    const checkInterval = checkIntervalInMinutes * 60000;

    const url = `https://api.mcstatus.io/v2/status/java/${serverIP}`;

    try {
      // Dynamically import the fetch function
      const fetch = (await import("node-fetch")).default;
      
      // Dynamically import the serverStatus model
      const { default: ServerStatus } = await import("../../../command-handler/models/server-status-schema.js");

      // Save server status with the channelId
      const serverStatus = new ServerStatus({
        _id: serverIP,  // Use serverIP as the unique identifier
        serverIP,
        interval: checkIntervalInMinutes, // Store the interval in minutes
        channelId, // Store the required channelId
      });

      // Save the server status to the database
      await serverStatus.save();

      // Create a loop to check the server status at the specified interval (in milliseconds)
      setInterval(async () => {
        try {
          const response = await fetch(url);
          const data = await response.json();

          // Check the server's online status
          const isOnline = data.online;
          const motd = data.motd?.clean || "Unknown";
          const onlinePlayers = data.players?.online || 0;
          const maxPlayers = data.players?.max || "Unknown";
          const version = data.version?.name_clean || "Unknown";

          // Construct status message based on server's state
          let statusMessage;
          if (!isOnline) {
            statusMessage = `${serverIP} is **OFFLINE**.`;
          } else {
            statusMessage = `${serverIP} is **ONLINE**.`;
          }

          // Check if the server has a channelId to send the message
          const channel = await client.channels.fetch(channelId);
          if (channel) {
            await channel.send(statusMessage);
          } else {
            console.error("Channel not found.");
          }

        } catch (error) {
          console.error("Error checking status:", error);
        }
      }, checkInterval);

      return {
        content: `Started monitoring the server **${serverIP}** with an interval of **${checkIntervalInMinutes} minutes** and updates will be sent to <#${channelId}>.`,
      };
    } catch (error) {
      console.error("Error in mc-alerts command:", error);
      return {
        content: "There was an error starting the status monitor. Please try again later.",
        ephemeral: true,
      };
    }
  },
};
