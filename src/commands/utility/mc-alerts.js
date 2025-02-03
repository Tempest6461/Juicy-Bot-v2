const {
  EmbedBuilder,
  PermissionFlagsBits,
  ApplicationCommandOptionType,
} = require("discord.js");

const ServerStatus = require("../../../command-handler/models/server-status-schema.js");

module.exports = {
  name: "mc-alerts",
  category: "Utility",
  description: "Monitor the status of a Minecraft server and alert on status changes.",
  type: "SLASH",
  testOnly: false,
  reply: true,
  guildOnly: true,
  permissions: [PermissionFlagsBits.SendMessages],

  options: [
    {
      name: "action",
      description: "The action to perform (start or stop).",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Start", value: "start" },
        { name: "Stop", value: "stop" },
      ],
    },
    {
      name: "server_ip",
      description: "The IP address of the Minecraft server.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "channel",
      description: "The channel to send status updates.",
      type: ApplicationCommandOptionType.Channel,
      required: true, // Channel is now required for both start and stop
    },
  ],

  callback: async ({ interaction, client }) => {
    const action = interaction.options.getString("action");
    const serverIP = interaction.options.getString("server_ip");
    const channel = interaction.options.getChannel("channel");

    if (action === "start") {
      return await startMonitoring({ serverIP, channel, client });
    }

    if (action === "stop") {
      return await stopMonitoring({ serverIP, channel });
    }

    return { content: "Invalid action. Use either `start` or `stop`.", ephemeral: true };
  },
};

// Function to start monitoring
async function startMonitoring({ serverIP, channel, client }) {
  try {
    let existingServer = await ServerStatus.findOne({ serverIP });

    if (existingServer) {
      existingServer.isMonitoring = true;

      // Add the channel ID only if it's not already in the array
      if (!existingServer.channelIds.includes(channel.id)) {
        existingServer.channelIds.push(channel.id);
      }

      await existingServer.save();
      console.log(`Updated server ${serverIP} for monitoring.`);
    } else {
      const newServer = new ServerStatus({
        _id: serverIP,
        serverIP,
        isMonitoring: true,
        channelIds: [channel.id],
      });

      await newServer.save();
      console.log(`Started monitoring server ${serverIP}.`);
    }

    return { content: `Monitoring started for server **${serverIP}** in <#${channel.id}>.` };
  } catch (error) {
    console.error("Error starting monitoring:", error);
    return { content: "Failed to start monitoring. Please try again later.", ephemeral: true };
  }
}

// Function to stop monitoring for a specific channel
async function stopMonitoring({ serverIP, channel }) {
  try {
    let existingServer = await ServerStatus.findOne({ serverIP });

    if (!existingServer || !existingServer.isMonitoring) {
      return { content: `Server **${serverIP}** is not currently being monitored.`, ephemeral: true };
    }

    // Remove the specified channel from the array
    existingServer.channelIds = existingServer.channelIds.filter(id => id !== channel.id);

    if (existingServer.channelIds.length === 0) {
      // No channels left, stop monitoring entirely
      existingServer.isMonitoring = false;
      console.log(`Stopped all monitoring for server ${serverIP}.`);
    } else {
      console.log(`Removed channel ${channel.id} from monitoring for ${serverIP}.`);
    }

    await existingServer.save();

    return { content: `Monitoring stopped for server **${serverIP}** in <#${channel.id}>.` };
  } catch (error) {
    console.error("Error stopping monitoring:", error);
    return { content: "Failed to stop monitoring. Please try again later.", ephemeral: true };
  }
}
