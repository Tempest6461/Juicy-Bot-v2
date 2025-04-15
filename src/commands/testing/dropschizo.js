const { PermissionFlagsBits } = require("discord.js");
const mongoose = require("mongoose");

module.exports = {
  name: "dropschizo",
  category: "Admin",
  description:
    "Drops the old schizo-counter collection used in the previous nickname schema.",

  correctSyntax: "Correct syntax: {PREFIX}dropschizo",
  type: "BOTH",
  reply: true,
  testOnly: false,
  guildOnly: true,
  ownerOnly: true,

  cooldowns: {
    perUserPerGuild: "10 s",
  },

  permissions: [PermissionFlagsBits.Administrator],

  callback: async ({ interaction, message }) => {
    const dbUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/YOUR_DB_NAME"; // replace YOUR_DB_NAME
    let response;

    try {
      await mongoose.connect(dbUri);

      const result = await mongoose.connection.db.dropCollection("schizo-counter");
      response = "✅ Successfully dropped the old `schizo-counter` collection.";
      console.log(response);
    } catch (error) {
      if (error.codeName === "NamespaceNotFound") {
        response =
          "ℹ️ The `schizo-counter` collection doesn't exist — nothing to delete.";
        console.log(response);
      } else {
        response = `❌ Error dropping collection: ${error.message}`;
        console.error(response);
      }
    } finally {
      await mongoose.disconnect();
    }

    return {
      ephemeral: true,
      content: response,
    };
  },
};
