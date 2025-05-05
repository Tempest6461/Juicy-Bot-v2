module.exports = {
  apps: [
    {
      name: 'lavalink',
      cwd: './command-handler/util/lavalink',
      script: './start-lavalink.sh',
      interpreter: 'bash'
    },
    {
      name: 'juicy-bot',
      cwd: '.',
      script: 'src/index.js',
      interpreter: 'node'
    }
  ]
};