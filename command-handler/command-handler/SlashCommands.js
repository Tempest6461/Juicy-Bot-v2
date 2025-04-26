// src/command-handler/command-handler/SlashCommands.js
const { ApplicationCommandOptionType } = require("discord.js");

class SlashCommands {
  constructor(client) {
    this._client = client;
  }

  /**
   * Fetches either the global application commands manager
   * or a specific guild's commands manager.
   * Returns null on failure.
   */
  async getCommands(guildId) {
    try {
      let commands;
      if (guildId) {
        const guild = await this._client.guilds.fetch(guildId);
        commands = guild.commands;
      } else {
        commands = this._client.application.commands;
      }
      await commands.fetch();
      return commands;
    } catch (error) {
      console.error(`[SlashCommands] getCommands error for ${guildId || 'global'}:`, error);
      return null;
    }
  }

  /**
   * Compares two option arrays for differences.
   */
  areOptionsDifferent(options, existingOptions) {
    if (!Array.isArray(options) || !Array.isArray(existingOptions)) return true;
    for (let i = 0; i < options.length; i++) {
      const o = options[i];
      const e = existingOptions[i];
      if (
        !e ||
        o.name !== e.name ||
        o.type !== e.type ||
        o.description !== e.description
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Creates or updates a slash command.
   * Skips if the commands manager isn't available.
   */
  async create(name, description, options, guildId) {
    const commands = await this.getCommands(guildId);
    if (!commands) {
      console.warn(`[SlashCommands] Skipping create for "${name}" (${guildId || 'global'}): manager unavailable`);
      return;
    }

    const existing = commands.cache.find(cmd => cmd.name === name);
    if (existing) {
      const { description: desc, options: opts } = existing;
      if (
        desc !== description ||
        opts.length !== options.length ||
        this.areOptionsDifferent(options, opts)
      ) {
        console.log(`[SlashCommands] Updating "${name}" (${guildId || 'global'})`);
        await commands.edit(existing.id, { description, options });
      }
      return;
    }

    console.log(`[SlashCommands] Creating "${name}" (${guildId || 'global'})`);
    await commands.create({ name, description, options });
  }

  /**
   * Deletes a slash command if it exists.
   * Skips if the commands manager isn't available.
   */
  async delete(commandName, guildId) {
    const commands = await this.getCommands(guildId);
    if (!commands) {
      console.warn(`[SlashCommands] Skipping delete for "${commandName}" (${guildId || 'global'}): manager unavailable`);
      return;
    }
    const existing = commands.cache.find(cmd => cmd.name === commandName);
    if (!existing) return;
    console.log(`[SlashCommands] Deleting "${commandName}" (${guildId || 'global'})`);
    await existing.delete();
  }

  /**
   * Generates option objects from an expectedArgs string like "<foo> <bar>".
   */
  createOptions({ expectedArgs = "", minArgs = 0 }) {
    const options = [];
    if (expectedArgs) {
      const split = expectedArgs
        .substring(1, expectedArgs.length - 1)
        .split(/[>\]] [<\[]/);
      for (let i = 0; i < split.length; ++i) {
        const arg = split[i];
        options.push({
          name: arg.toLowerCase().replace(/\s+/g, "-"),
          description: arg,
          type: ApplicationCommandOptionType.String,
          required: i < minArgs,
        });
      }
    }
    return options;
  }
}

module.exports = SlashCommands;
