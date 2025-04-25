const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "mcserver-stats",
  category: "Utility",
  description: "Get the stats of a Minecraft server.",

  minArgs: 1,
  correctSyntax: "Correct syntax: {PREFIX}mcserver-stats <server IP>",
  expectedArgs: "<server IP>",

  type: "BOTH",
  testOnly: false,
  reply: true,
  guildOnly: true,

  permissions: [PermissionFlagsBits.SendMessages],

  callback: async ({ args }) => {
    const serverIP = args[0].trim(); // Remove extra spaces around server IP


    const url = `https://api.mcstatus.io/v2/status/java/${serverIP}`;

    try {
      // Log the full URL to debug
    //   console.log(`Fetching server status from: ${url}`);

      const fetch = (await import("node-fetch")).default;
      const response = await fetch(url);

      if (!response.ok) {
        return {
          content: `Failed to fetch server status. Status code: ${response.status}`,
          ephemeral: true,
        };
      }

      const data = await response.json();
      if (!data.online) {
        return {
          content: "The server is offline or the IP is incorrect.",
          ephemeral: true,
        };
      }

      const motd = data.motd?.clean || "Unknown";
      const onlinePlayers = data.players?.online || 0;
      const maxPlayers = data.players?.max || "Unknown";
      const version = data.version?.name_clean || "Unknown";

      let connectedPlayersMessage = "The server is currently empty.";
      if (data.players?.list?.length > 0) {
        const players = data.players.list
          .slice(0, 10)
          .map((player) => `- ${player.name_clean}`)
          .join("\n");
        connectedPlayersMessage =
          players + (data.players.list.length > 10 ? "\n- and more..." : "");
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Minecraft Server Stats")
        .addFields(
          { name: "MOTD", value: motd, inline: true },
          { name: "Server IP", value: `${serverIP}`, inline: true },
          { name: "Online Players", value: `${onlinePlayers}/${maxPlayers}`, inline: true },
          { name: "Version", value: version, inline: true },
          { name: "Connected Players", value: connectedPlayersMessage, inline: false }
        )
        .setTimestamp();

      return {
        embeds: [embed],
      };
    } catch (error) {
      console.error("Error fetching server status:", error); // Debug log
      return {
        content: "There was an error getting the server status. Please try again later.",
        ephemeral: true,
      };
    }
  },
};
