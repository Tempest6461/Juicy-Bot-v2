// src/index.js
const {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
} = require("discord.js");
const CH = require("../command-handler");
const welcome = require("./events/guildMemberAdd/welcome.js");
const goodbye = require("./events/guildMemberRemove/goodbye.js");
const path = require("path");
require("dotenv/config");

// import the mood decay function
const { decayMood } = require("../command-handler/util/mood.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// ★ Initialize Juicy’s mood state ★
client.juicyState = {
  mood: "neutral",          // happy | neutral | salty | hyped
  lastMoodChange: Date.now(),
};

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  client.user.setActivity("with my code.", { type: ActivityType.PLAYING });

  // ★ Every minute, drift Juicy’s mood back toward neutral ★
  setInterval(() => decayMood(client), 60 * 1000);

  // ★ Initialize Command Handler after ready ★
  new CH({
    client,
    mongoUri: process.env.MONGO_URI,
    commandsDir: path.join(__dirname, "commands"),
    testServers: ["529877137268670465"],
    botOwners: [
      "131562657680457729",
      "1014618816115916871",
      "243432636972793856",
      "1052879147392835634",
    ],
    cooldownConfig: {
      errorMessage: "Please wait {TIME}",
      botOwnerBypass: true,
      dbRequired: 300, // 5 minutes
    },
    events: {
      dir: path.join(__dirname, "events"),
      interactionCreate: {
        isButton: (interaction) => interaction.isButton(),
      },
      messageCreate: {
        isHuman: (message) => !message.author.bot,
      },
      validations: {
        runtime: path.join(__dirname, "validations", "runtime"),
        syntax: path.join(__dirname, "validations", "syntax"),
      },
    },
  });
});

// Log in after wiring up the ready handler
client.login(process.env.TOKEN);
