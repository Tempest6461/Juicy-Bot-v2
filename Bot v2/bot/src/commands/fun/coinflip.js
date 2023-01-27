const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "coinflip",
    category: "Fun",
    description: "Flip a coin.",

    minArgs: 0,
    correctSyntax: "Correct syntax: {PREFIX}coinflip",
    expectedArgs: "",

    type: "BOTH",
    testOnly: false,
    reply: true,
    guildOnly: true,

    permissions: [PermissionFlagsBits.SendMessages],

    callback: ({ message }) => {
        const randomNumber = Math.floor(Math.random() * 2);

        let coin = "";
        switch (randomNumber) {
            case 0:
                coin = "Heads";
                break;
            case 1:
                coin = "Tails";
                break;
        }
        const embed = new EmbedBuilder()
            .setTitle("Coin Flip")
            .setDescription(`The coin landed on **${coin}**!`)
            .setColor(0x0099ff)
            .setTimestamp(Date.now())
            .setImage(`https://i.imgur.com/LR8H64R.gif`)
        return {
            embeds: [embed],
        };
        
    }
}