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
      required: false,
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
      return await stopMonitoring({ serverIP });
    }

    return { content: "Invalid action. Use either `start` or `stop`.", ephemeral: true };
  },
};

// Function to start monitoring
async function startMonitoring({ serverIP, channel, client }) {
  try {
    const existingServer = await ServerStatus.findOne({ serverIP });

    if (existingServer) {
      existingServer.isMonitoring = true;

      // Add the channel ID if not already present
      if (channel && !existingServer.channelIds.includes(channel.id)) {
        existingServer.channelIds.push(channel.id);
      }

      await existingServer.save();
      console.log(`Updated server ${serverIP} for monitoring.`);
    } else {
      const newServer = new ServerStatus({
        _id: serverIP,
        serverIP,
        isMonitoring: true,
        channelIds: channel ? [channel.id] : [],
      });

      await newServer.save();
      console.log(`Started monitoring server ${serverIP}.`);
    }

    return { content: `Monitoring started for server **${serverIP}**.` };
  } catch (error) {
    console.error("Error starting monitoring:", error);
    return { content: "Failed to start monitoring. Please try again later.", ephemeral: true };
  }
}

// Function to stop monitoring
async function stopMonitoring({ serverIP }) {
  try {
    const existingServer = await ServerStatus.findOne({ serverIP }); // Find the server in the database

    if (!existingServer || !existingServer.isMonitoring) {
      return { content: `Server **${serverIP}** is not currently being monitored.`, ephemeral: true };
    }

    existingServer.isMonitoring = false;
    await existingServer.save(); 
    console.log(`Stopped monitoring server ${serverIP}.`);

    return { content: `Monitoring stopped for server **${serverIP}**.` };
  } catch (error) {
    console.error("Error stopping monitoring:", error);
    return { content: "Failed to stop monitoring. Please try again later.", ephemeral: true };
  }
}
