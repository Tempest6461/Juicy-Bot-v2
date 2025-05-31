// bot/command-handler/command-handler/SlashCommands.js

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

class SlashCommands {
  /**
   * @param {import('discord.js').Client} client
   */
  constructor(client) {
    this._client = client;

    // When the bot joins a new guild, we expect CommandHandler to supply
    // the current guild-scoped definitions (so we can bulk overwrite them there).
    // We'll attach a placeholder listener for demonstration, but the handler
    // will call bulkRegisterGuild(...) directly rather than relying on this.
    this._client.on("guildCreate", (guild) => {
      // No-op: CommandHandler should call bulkRegisterGuild(guild.id, guildDefs)
      console.log(`✨ guildCreate fired for ${guild.id} (“${guild.name}”), but CommandHandler will handle registration.`);
    });
  }

  /**
   * Bulk-overwrites all slash commands in a single guild using the provided definitions array.
   * @param {string} guildId
   * @param {Array<{ name: string, description: string, options: any[] }>} commandsJSON
   */
  async bulkRegisterGuild(guildId, commandsJSON) {
    if (!Array.isArray(commandsJSON) || commandsJSON.length === 0) {
      console.log(`→ [SlashCommands] No guild-scoped commands to register for guild ${guildId}`);
      return;
    }

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    try {
      await rest.put(
        Routes.applicationGuildCommands(this._client.user.id, guildId),
        { body: commandsJSON }
      );
      console.log(`✅ [SlashCommands] Bulk-registered ${commandsJSON.length} commands in guild ${guildId}`);
    } catch (err) {
      console.error(`❌ [SlashCommands] Failed bulk-register in guild ${guildId}: ${err.message}`);
    }
  }
}

module.exports = SlashCommands;