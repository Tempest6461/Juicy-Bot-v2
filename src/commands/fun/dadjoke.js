const axios = require('axios');
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {

    name: "dadjoke",
    category: "Fun",
    description: "Get a random dad joke!",

    minArgs: 0,
    correctSyntax: "Correct syntax: {PREFIX}dadjoke",
    expectedArgs: "",
    type: "BOTH",
    
    testOnly: false,
    reply: true,
    guildOnly: true,

    permissions: [PermissionFlagsBits.SendMessages],


    callback: async ({ interaction, message }) => {
        try {
            // Make a GET request to the dad joke API
            const response = await fetch('https://icanhazdadjoke.com/', {
              headers: {
                Accept: 'application/json',
              },
            });
      
            if (!response.ok) {
              throw new Error('Failed to fetch dad joke');
            }
      
            // Parse the JSON response
            const data = await response.json();
      
            // Extract the dad joke from the response
            const joke = data.joke;
      
            const embed = new EmbedBuilder()
            .setTitle(`👴 | Random Dad Joke`)
			.setColor('Random')
			.setFooter({
				text: `${interaction.user.tag}`,
				iconURL: `${interaction.user.displayAvatarURL({
					forceStatic: true,
				})}`,
			})
			.setDescription(joke);
      
            return {
              embeds: [embed],
            };
          } catch (error) {
            console.error(error);
            return {
              content: 'An error occurred while fetching the dad joke. Please try again later.',
            };
          }
        },
    };

