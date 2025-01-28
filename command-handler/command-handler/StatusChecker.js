const { EmbedBuilder } = require("discord.js");

let previousStatuses = {};

async function checkServerStatus(client) {
  if (!client) {
    console.error("Client is undefined!");
    return;
  }

  const { default: ServerStatus } = await import("../../command-handler/models/server-status-schema.js");
  const fetch = (await import("node-fetch")).default;
  const servers = await ServerStatus.find({ isMonitoring: true });

  const currentTime = Date.now();

  for (const server of servers) {
    const { serverIP, interval, channelIds, lastChecked } = server;
    const nextCheckTime = lastChecked ? lastChecked + interval * 60000 : 0;

    if (currentTime < nextCheckTime) {
      continue; // Skip this server if it's not time to check it yet
    }

    const url = `https://api.mcstatus.io/v2/status/java/${serverIP}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      const embed = new EmbedBuilder()
        .setTimestamp()
        .setTitle(`${serverIP} Status Update`);

      if (!data.online) {
        if (previousStatuses[serverIP] !== false) {
          embed.setColor(0xff0000).setDescription("The server is currently **offline**.");
          for (const channelId of channelIds) {
            await sendStatusMessage(client, channelId, embed);
          }
          previousStatuses[serverIP] = false;
        }
      } else {
        if (previousStatuses[serverIP] !== true) {
          embed.setColor(0x00ff00).setDescription("The server is now **online**.");
          for (const channelId of channelIds) {
            await sendStatusMessage(client, channelId, embed);
          }
          previousStatuses[serverIP] = true;
        }
      }

      // Update lastChecked time in the database
      server.lastChecked = currentTime;
      await server.save();
    } catch (error) {
      console.error(`Error fetching status for ${serverIP}:`, error);
    }
  }
}

async function sendStatusMessage(client, channelId, embed) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel) await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(`Error sending message to channel ${channelId}:`, error);
  }
}

async function startMonitoring(client) {
  setInterval(() => checkServerStatus(client), 60000); // Global check every minute
}

module.exports = { startMonitoring };
