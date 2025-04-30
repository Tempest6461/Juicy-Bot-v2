module.exports = {
    apps: [
      {
        name: 'juicy-bot',
        script: 'src/index.js',
        cwd: '/root/Juicy-Bot-v2',
        env: {
          // paste in the exact PATH from step 1 below:
          PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin'
        }
      }
    ]
  };