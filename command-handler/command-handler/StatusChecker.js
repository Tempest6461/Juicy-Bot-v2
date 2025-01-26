const { EmbedBuilder } = require("discord.js");

// Store the previous status of each server to detect changes
let previousStatuses = {};

async function checkServerStatus(client) {
  if (!client) {
    console.error("Client is undefined!");
    return;
  }

  try {
    // Dynamically import the ServerStatus model with the corrected path
    const { default: ServerStatus } = await import("../../command-handler/models/server-status-schema.js");

    // Dynamically import node-fetch
    const fetch = (await import("node-fetch")).default;

    const servers = await ServerStatus.find(); // Get all server IPs and intervals from DB

    for (const server of servers) {
      const { serverIP, interval, channelIds } = server; // Assuming channelIds is stored in DB
      const url = `https://api.mcstatus.io/v2/status/java/${serverIP}`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.online) {
          if (previousStatuses[serverIP] !== false) {
            // The server was online and now it's offline
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle(`${serverIP} is Offline`)
              .setDescription("The Minecraft server is currently offline.")
              .setTimestamp();
            
            // Send status message to all channels associated with the server
            for (const channelId of channelIds) {
              await sendStatusMessage(client, channelId, embed);
            }

            previousStatuses[serverIP] = false; // Update the status to offline
          }
        } else {
          if (previousStatuses[serverIP] !== true) {
            // The server was offline and now it's online
            const embed = new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle(`${serverIP} is Online`)
              .setDescription("The Minecraft server is back online!")
              .setTimestamp();
            
            // Send status message to all channels associated with the server
            for (const channelId of channelIds) {
              await sendStatusMessage(client, channelId, embed);
            }

            previousStatuses[serverIP] = true; // Update the status to online
          }
        }
      } catch (error) {
        console.error(`Error fetching status for ${serverIP}:`, error);
      }
    }
  } catch (error) {
    console.error("Error checking server status:", error);
  }
}

// Helper function to send status message to Discord channel
async function sendStatusMessage(client, channelId, embed) {
  if (!client || !client.channels) {
    console.error("Client or client.channels is undefined.");
    return;
  }

  try {
    const channel = await client.channels.fetch(channelId);
    if (channel) {
      await channel.send({ embeds: [embed] });
    } else {
      console.error(`Channel with ID ${channelId} not found.`);
    }
  } catch (error) {
    console.error("Error sending status message:", error);
  }
}

// Set an interval for checking server status every minute (or dynamically based on the stored value)
async function startMonitoring(client) {
  if (!client) {
    console.error("Client is undefined!");
    return;
  }

  // Dynamically import the ServerStatus model with the corrected path
  const { default: ServerStatus } = await import("../../command-handler/models/server-status-schema.js");

  const servers = await ServerStatus.find();

  // For each server, set up a monitoring interval
  for (const server of servers) {
    // Perform an immediate first check
    await checkServerStatus(client);

    // Then set an interval for the future checks
    setInterval(() => checkServerStatus(client), server.interval * 60000); // Convert minutes to ms
  }
}

// Export the startMonitoring function so it can be used elsewhere
module.exports = { startMonitoring };
