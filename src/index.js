// bot/src/index.js
// ─── Load .env before anything else ───────────────────────────────────────────
require('dotenv/config');

// ─── Spawn Lavalink ──────────────────────────────────────────────────────────
const { spawn } = require('child_process');
const path      = require('path');

const jarPath = path.resolve(
  __dirname,
  'command-handler',
  'util',
  'lavalink',
  'Lavalink.jar'
);

// pick up JAVA_PATH from .env, or fall back to whatever `java` is in PATH
const javaBin = process.env.JAVA_PATH || 'java';
const useShell = process.platform === 'win32';

console.log(`🟢 Spawning Lavalink: ${javaBin} -jar ${jarPath}`);
const lavalink = spawn(
  javaBin,
  ['-jar', jarPath],
  {
    cwd: path.dirname(jarPath),
    stdio: 'inherit',
    shell: useShell
  }
);

lavalink.on('error', err =>
  console.error('❌ Failed to start Lavalink process:', err)
);
lavalink.on('exit', code =>
  console.log('⚠️ Lavalink exited with code', code)
);

process.once('exit',  () => lavalink.kill());
process.once('SIGINT', () => process.exit());
// ───────────────────────────────────────────────────────────────────────────────

const { Client, GatewayIntentBits, Partials, ActivityType } = require('discord.js');
const { Manager } = require('erela.js');
const CH = require('../command-handler');
const { decayMood } = require('../command-handler/util/mood');

// Import your MusicHandler singleton
const musicHandler = require('../command-handler/command-handler/MusicHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// ─── Lavalink Manager ─────────────────────────────────────────────────────────
client.manager = new Manager({
  nodes: [{
    host: '127.0.0.1',
    port: 2333,
    password: 'Grizzly101*',  // match application.yml
    identifier: 'MainNode',
    secure: false,
    version: 'v4',              
    useVersionPath: true        
  }],
  send: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  }
})
  .on('nodeConnect', node =>
    console.log(`[Lavalink] Node connected: ${node.options.identifier}`)
  )
  .on('nodeError', (node, err) =>
    console.error(`[Lavalink] Node ${node.options.identifier} error:`, err)
  );

// don’t forget to forward raw voice updates…
client.on('raw', d => client.manager.updateVoiceState(d));

// ─── Auto‐disconnect when alone in VC ─────────────────────────────────────────
client.on('voiceStateUpdate', (oldState, newState) => {
  // Only care about the guild where you have an active music subscription
  const guildId = oldState.guild.id;
  const sub = musicHandler.subs.get(guildId);
  if (!sub) return;

  const botChannelId = sub.connection.joinConfig.channelId;
  if (!botChannelId) return;

  // If someone left the channel the bot is in…
  if (oldState.channelId === botChannelId) {
    const channel = oldState.guild.channels.cache.get(botChannelId);
    if (!channel) return;
    // Count non-bot users
    const humanCount = channel.members.filter(m => !m.user.bot).size;
    if (humanCount === 0) {
      // Tear down immediately
      try {
        musicHandler.stop(guildId);
      } catch (err) {
        console.error(`Error stopping music when alone: ${err.message}`);
      }
    }
  }
});

// ─── Ready & Command Handler ─────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity('with my code.', { type: ActivityType.PLAYING });
  setInterval(() => decayMood(client), 60 * 1000);

  // init erela.js now that the client is ready
  client.manager.init(client.user.id);

  // wire up your commands/events as before
  new CH({
    client,
    mongoUri: process.env.MONGO_URI,
    commandsDir: path.join(__dirname, 'commands'),
    testServers: ['529877137268670465'],
    botOwners: [
      '131562657680457729',
      '1014618816115916871',
      '243432636972793856',
      '1052879147392835634'
    ],
    cooldownConfig: {
      errorMessage: 'Please wait {TIME}',
      botOwnerBypass: true,
      dbRequired: 300
    },
    events: {
      dir: path.join(__dirname, 'events'),
      interactionCreate: { isButton: i => i.isButton() },
      messageCreate:      { isHuman: m => !m.author.bot },
      validations: {
        runtime: path.join(__dirname, 'validations', 'runtime'),
        syntax:  path.join(__dirname, 'validations', 'syntax'),
      },
    },
  });
});

client.login(process.env.TOKEN);
