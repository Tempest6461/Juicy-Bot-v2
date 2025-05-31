const { PermissionFlagsBits, ApplicationCommandOptionType } = require("discord.js");
const welcomeHandler = require("../../events/guildMemberAdd/welcome.js");

module.exports = {
  name: "simevent",
  description: "Simulate Discord events for testing purposes.",
  category: "Testing",
  type: "SLASH",
  testOnly: false,
  guildOnly: true,
  permissions: [PermissionFlagsBits.Administrator],

  options: [
    {
      name: "type",
      description: "Which event to simulate",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Join", value: "join" },
        { name: "Leave", value: "leave" },
        // Extend here later
      ],
    },
  ],

  callback: async ({ interaction, client, instance }) => {
    const type = interaction.options.getString("type");
    const member = interaction.member;

    try {
      switch (type) {
        case "join":
          await interaction.reply({ content: "✅ Simulating member join...", ephemeral: true });
          await welcomeHandler(member, instance); // Passes instance properly
          break;

        case "leave":
          await interaction.reply({ content: "✅ Simulating member leave...", ephemeral: true });
          client.emit("guildMemberRemove", member);
          break;

        default:
          await interaction.reply({ content: "❌ Unknown event type.", ephemeral: true });
          break;
      }
    } catch (err) {
      console.error(`[SimEvent Error]:`, err);
      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ An error occurred while simulating the event.",
          ephemeral: true,
        });
      }
    }
  },
};
