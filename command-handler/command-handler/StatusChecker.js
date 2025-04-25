const { EmbedBuilder } = require("discord.js");

async function checkServerStatus(client) {
  const { default: ServerStatus } = await import(
    "../../command-handler/models/server-status-schema.js"
  );
  const fetch = (await import("node-fetch")).default;

  const servers = await ServerStatus.find({ isMonitoring: true }); // Get all servers being monitored

  // Check the status of each server
  for (const server of servers) {
    const { serverIP, channelIds, previousStatus } = server;
    const url = `https://api.mcstatus.io/v2/status/java/${serverIP}`;

    try {
      // console.log(`Checking status for ${serverIP}...`);
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`API returned status: ${response.status}`);
      
      const data = await response.json();
      // console.log(`API Response for ${serverIP}:`, data);
      
      const isOnline = data.online ?? null;
      if (isOnline === null) {
        console.error(`Invalid API response for ${serverIP}:`, data);
        continue;
      }

      // Check if the status has changed
      if (previousStatus !== isOnline) {
        console.log(`Status change detected for ${serverIP}: ${isOnline ? "Online" : "Offline"}`);
        
        // Update the status in the database
        server.previousStatus = isOnline;
        await server.save();

        // Create an embed and send status updates
        const embed = createStatusEmbed(serverIP, isOnline);
        for (const channelId of channelIds) {
          await sendStatusMessage(client, channelId, embed).catch(error => {
            console.error(`Failed to send message to ${channelId}:`, error);
          });
        }
      }
    } catch (error) {
      console.error(`Error checking server ${serverIP}:`, error);
    }
  }
}

// Create an embed for the status update
function createStatusEmbed(serverIP, isOnline) {
  const embed = new EmbedBuilder()
    .setTitle(`${serverIP} Status Update`)
    .setTimestamp();
  
  if (isOnline) {
    embed.setColor(0x00ff00).setDescription("The server is now **online**.");
  } else {
    embed.setColor(0xff0000).setDescription("The server is currently **offline**.");
  }
  return embed;
} 

// Send a status message to the specified channel
async function sendStatusMessage(client, channelId, embed) {
  try {
    const channel = await client.channels.fetch(channelId);
    
    if (channel.isThread() && channel.joinable) {
      await channel.join(); // Join the thread if possible
    }
    
    await channel.send({ embeds: [embed] });
  } catch (error) {
    if (error.code === 50001) {
      console.error(`The bot isn't in the guild of channel ${channelId}.`);
    } else {
      console.error(`Error sending message to channel ${channelId}:`, error);
    }
  }
}

function startMonitoring(client) {
  setInterval(() => checkServerStatus(client), 60000); // Check all servers every minute
}

module.exports = { startMonitoring };
