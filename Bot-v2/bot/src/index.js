const {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
} = require("discord.js");
const CH = require("command-handler");
const welcome = require("./events/guildMemberAdd/welcome.js");
const goodbye = require("./events/guildMemberRemove/goodbye.js");
const path = require("path");
require("dotenv/config");

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

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);

  client.user.setActivity("with my code.", { type: ActivityType.PLAYING });
});

(async () => {
  await client.login(process.env.TOKEN);

  const instance = new CH({
    client,
    mongoUri: process.env.MONGO_URI,
    commandsDir: path.join(__dirname, "commands"),
    featuresDir: path.join(__dirname, "features"),
    testServers: ["529877137268670465"],
    botOwners: ["131562657680457729", "1014618816115916871", "243432636972793856"],
    cooldownConfig: {
      errorMessage: "Please wait {TIME}",
      botOwnerBypass: true,
      dbRequired: 300, // 5 minutes
    },
    disabledDefaultCommands: [
      'requiredroles',
      'requiredpermissions',
      'requiredroles',
      'channelcommand',
      'togglecommand',
    ],
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
})();
