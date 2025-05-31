const { PermissionFlagsBits } = require("discord.js");
const UserXP = require("../../../command-handler/models/user-xp-schema");

module.exports = {
  name: "resetlevel",
  description: "🔧 DEBUG: Reset a user's XP and level.",
  category: "Levels",
  type: "SLASH",
  guildOnly: true,
  testOnly: false,

  options: [
    {
      name: "user",
      description: "User to reset",
      required: true,
      type: 6, // USER
    },
  ],

  permissions: [PermissionFlagsBits.Administrator],

  callback: async ({ interaction }) => {
    const user = interaction.options.getUser("user");
    const guildId = interaction.guild.id;

    const result = await UserXP.findOneAndUpdate(
      { userId: user.id, guildId },
      { $set: { xp: 0, level: 1 } },
      { new: true, upsert: true }
    );

    return interaction.reply({
      content: `🧼 Reset **${user.tag}**'s XP and level to 1.`,
      ephemeral: true,
    });
  },
};
