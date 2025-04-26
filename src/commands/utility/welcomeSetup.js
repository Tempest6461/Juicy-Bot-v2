// src/commands/utility/welcomeSetup.js

const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "welcomesetup",
  category: "Utility",
  description: "Enable or disable welcoming, and set the welcome channel.",
  expectedArgs: "<start|stop> [channel]",
  type: "BOTH",
  testOnly: false,
  guildOnly: true,
  cooldowns: {
    perUserPerGuild: "1 m",
  },
  permissions: [PermissionFlagsBits.Administrator],
  options: [
    {
      name: "action",
      description: "Start (on) or stop (off) welcoming. Off by default.",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Start Welcoming (on)", value: "start" },
        { name: "Stop Welcoming (off)", value: "stop" },
      ],
    },
    {
      name: "channel",
      description: "The channel to use for welcoming new members (required if action = start).",
      type: ApplicationCommandOptionType.Channel,
      required: false,
    },
  ],
  callback: async ({ instance, guild, interaction, message, args }) => {
    const welcomeChannels = instance.commandHandler.welcomeChannels;

    // Determine action
    let action;
    if (interaction) {
      action = interaction.options.getString("action");
    } else {
      action = args[0] ? args[0].toLowerCase() : "stop";
    }

    if (!["start", "stop", "on", "off"].includes(action)) {
      const errMsg = "Invalid action. Use `start` or `stop`.";
      if (interaction) return interaction.reply({ content: errMsg, ephemeral: true });
      else return message.reply(errMsg);
    }

    // Normalize synonyms
    if (action === "on") action = "start";
    if (action === "off") action = "stop";

    // Defer reply for slash commands
    if (interaction) await interaction.deferReply({ ephemeral: true });

    // Handle stop
    if (action === "stop") {
      try {
        await welcomeChannels.remove(guild.id);
        const confirmation = "✅ Welcoming has been disabled for this server.";
        if (interaction) return interaction.editReply({ content: confirmation });
        else return message.reply(confirmation);
      } catch (err) {
        console.error("welcomeSetup stop error:", err);
        const errorText = `⚠️ There was an error disabling welcoming.\n\`${err.message || err}\``;
        if (interaction) return interaction.editReply({ content: errorText });
        else return message.reply(errorText);
      }
    }

    // action === "start"
    // Resolve channel argument
    let channel;
    if (interaction) {
      channel = interaction.options.getChannel("channel");
    } else {
      channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
    }

    if (!channel) {
      const errText = "You need to specify a channel when starting welcoming.";
      if (interaction) return interaction.editReply({ content: errText });
      else return message.reply(errText);
    }

    try {
      await welcomeChannels.add(guild.id, channel.id);
      const successText = `✅ Welcoming is now enabled, and the welcome channel has been set to ${channel}.`;
      if (interaction) await interaction.editReply({ content: successText });
      else message.reply(successText);
    } catch (err) {
      console.error("welcomeSetup start error:", err);
      const errorText = `⚠️ There was an error setting the welcoming channel.\n\`${err.message || err}\``;
      if (interaction) return interaction.editReply({ content: errorText });
      else return message.reply(errorText);
    }
  },
};
