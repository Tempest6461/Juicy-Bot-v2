// src/commands/utility/setup.js

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ComponentType,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

const AISettings = require("../../../command-handler/models/ai-settings-schema");
// (We no longer import welcomeSetup.js because you deleted it.)

module.exports = {
  name: "setupmenu",
  description: "🔧 Interactive menu: configure Welcome or AI-chime settings.",
  category: "Utility",
  type: "SLASH",
  guildOnly: true,
  testOnly: false,
  permissions: [PermissionFlagsBits.Administrator],

  callback: async ({ instance, interaction }) => {
    const isFirstReply = !interaction.replied && !interaction.deferred;

    if (isFirstReply) {
      // 1) Send a new in-channel message with the “Welcome vs AI” dropdown
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🛠️ Setup Menu")
            .setDescription(
              "Select one of the options below to configure:\n\n" +
                "• **Welcome Setup** (automatically welcome new members)\n" +
                "• **AI Chime Setup** (random bot chimes in some channels)\n\n" +
                "__Only you can interact with these controls.__"
            )
            .setColor(0x0099ff),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("setup-primarySelect")
              .setPlaceholder("Choose a setup category…")
              .addOptions([
                {
                  label: "Welcome Setup",
                  description: "Enable/Disable or change welcome channel",
                  value: "setup_welcome",
                },
                {
                  label: "AI Chime Setup",
                  description: "Enable/Disable or change AI chime channels/rate",
                  value: "setup_ai",
                },
              ])
          ),
        ],
      });

      const mainMessage = await interaction.fetchReply();
      return showMainMenu(mainMessage, instance, interaction);
    } else {
      // If (for some reason) we were already replied, just re-show the menu:
      const mainMessage = await interaction.fetchReply();
      return showMainMenu(mainMessage, instance, interaction);
    }
  },
};


// ─── Helper: Renders the “Welcome vs AI” dropdown and installs a collector ───
async function showMainMenu(mainMessage, instance, interaction) {
  // 1) Edit the message back to the “main menu” embed + dropdown
  await mainMessage.edit({
    embeds: [
      new EmbedBuilder()
        .setTitle("🛠️ Setup Menu")
        .setDescription(
          "Select one of the options below to configure:\n\n" +
            "• **Welcome Setup** (automatically welcome new members)\n" +
            "• **AI Chime Setup** (random bot chimes in some channels)\n\n" +
            "__Only you can interact with these controls.__"
        )
        .setColor(0x0099ff),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("setup-primarySelect")
          .setPlaceholder("Choose a setup category…")
          .addOptions([
            {
              label: "Welcome Setup",
              description: "Enable/Disable or change welcome channel",
              value: "setup_welcome",
            },
            {
              label: "AI Chime Setup",
              description: "Enable/Disable or change AI chime channels/rate",
              value: "setup_ai",
            },
          ])
      ),
    ],
  });

  // 2) Create a fresh collector on that dropdown (only this user)
  const filter = (i) =>
    i.user.id === interaction.user.id && i.customId === "setup-primarySelect";

  const collector = mainMessage.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 120000,
    filter,
    max: 1,
  });

  collector.on("collect", async (selectInteraction) => {
    const choice = selectInteraction.values[0]; // "setup_welcome" or "setup_ai"

    // ─────────────– WELCOME BRANCH –─────────────
    if (choice === "setup_welcome") {
      const welcomeChannels = instance.commandHandler.welcomeChannels;
      // Read the stored welcome channel directly:
      const savedChannelId = welcomeChannels[interaction.guild.id] || null;

      let currentText;
      if (savedChannelId) {
        const ch = interaction.guild.channels.cache.get(savedChannelId);
        currentText = ch
          ? `Currently set to ${ch}`
          : `Previously set to <#${savedChannelId}>, but that channel no longer exists.`;
      } else {
        currentText = "No welcome channel has been configured yet.";
      }

      const welcomeEmbed = new EmbedBuilder()
        .setTitle("👋 Welcome Setup")
        .setDescription(
          `${currentText}\n\n` +
            "▶️ **Enable/Change Channel** will let you pick a new channel.\n" +
            "⏹️ **Disable** will turn off welcoming entirely.\n" +
            "↩️ **Back** will return to the main menu."
        )
        .setColor(0x00bb00);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("welcome_enable")
          .setLabel(savedChannelId ? "🔄 Change Channel" : "▶️ Enable")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("welcome_disable")
          .setLabel("⏹️ Disable")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("welcome_back")
          .setLabel("↩️ Back")
          .setStyle(ButtonStyle.Secondary)
      );

      // Respond to the dropdown selectInteraction with an update:
      await selectInteraction.update({
        embeds: [welcomeEmbed],
        components: [row],
      });

      // ─── Collector for the “Welcome” buttons ───
      const buttonCollector = selectInteraction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000,
        filter: (btnInt) =>
          btnInt.user.id === interaction.user.id &&
          ["welcome_enable", "welcome_disable", "welcome_back"].includes(btnInt.customId),
        max: 1,
      });

      buttonCollector.on("collect", async (btnInt) => {
        // If “Back” was clicked, re-show the main menu:
        if (btnInt.customId === "welcome_back") {
          return showMainMenu(mainMessage, instance, interaction);
        }

        // If “Disable” was clicked:
        if (btnInt.customId === "welcome_disable") {
          try {
            await welcomeChannels.remove(interaction.guild.id);
            return btnInt.update({
              embeds: [
                new EmbedBuilder()
                  .setTitle("👋 Welcome Setup")
                  .setDescription("✅ Welcoming has been disabled.")
                  .setColor(0xcc0000),
              ],
              components: [],
            });
          } catch (err) {
            console.error("Error disabling welcome:", err);
            return btnInt.update({
              embeds: [
                new EmbedBuilder()
                  .setTitle("👋 Welcome Setup")
                  .setDescription(
                    `⚠️ Could not disable welcoming.\n\`${err.message}\``
                  )
                  .setColor(0xcc0000),
              ],
              components: [],
            });
          }
        }

        // If “Enable/Change Channel” was clicked:
        if (btnInt.customId === "welcome_enable") {
          const channelSelectRow = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId("welcome_channelSelect")
              .setPlaceholder("Select a channel to welcome new members in…")
              .addChannelTypes(0, 5, 15) // GUILD_TEXT, GUILD_ANNOUNCEMENT, GUILD_FORUM
              .setMinValues(1)
              .setMaxValues(1)
          );

          return btnInt.update({
            embeds: [
              new EmbedBuilder()
                .setTitle("👋 Welcome Setup")
                .setDescription(
                  "Please pick the **text/announcement/forum** channel you want new members to be greeted in:"
                )
                .setColor(0x00bb00),
            ],
            components: [channelSelectRow],
          });
        }
      });

      // ─── Collector for the “Welcome ChannelSelectMenu” ───
      const channelCollector = selectInteraction.channel.createMessageComponentCollector({
        componentType: ComponentType.ChannelSelect,
        time: 120000,
        filter: (chanInt) =>
          chanInt.user.id === interaction.user.id && chanInt.customId === "welcome_channelSelect",
        max: 1,
      });

      channelCollector.on("collect", async (chanInt) => {
        const pickedChannel = chanInt.channels.first();
        try {
          await instance.commandHandler.welcomeChannels.add(
            interaction.guild.id,
            pickedChannel.id
          );
          return chanInt.update({
            embeds: [
              new EmbedBuilder()
                .setTitle("👋 Welcome Setup")
                .setDescription(
                  `✅ Welcome channel set to ${pickedChannel}. New members will now be greeted here.`
                )
                .setColor(0x00bb00),
            ],
            components: [],
          });
        } catch (err) {
          console.error("Error saving welcome channel:", err);
          return chanInt.update({
            embeds: [
              new EmbedBuilder()
                .setTitle("👋 Welcome Setup")
                .setDescription(
                  `⚠️ Could not set welcome channel.\n\`${err.message}\``
                )
                .setColor(0xcc0000),
            ],
            components: [],
          });
        }
      });
    }


    // ─────────────– AI CHIME BRANCH –─────────────
    if (choice === "setup_ai") {
      // 1) Load existing AISettings (or create a placeholder if none exist)
      const guildId = interaction.guild.id;
      let existing = await AISettings.findOne({ guildId });
      const currentRate = existing?.chimeRate ?? 0;
      const currentChannels = Array.isArray(existing?.chimeChannelIds)
        ? existing.chimeChannelIds
            .map((id) => {
              const c = interaction.guild.channels.cache.get(id);
              return c ? `${c}` : `\`#${id}\``;
            })
            .join(", ")
        : "None";

      // 2) Build the AI-embed + buttons
      const aiEmbed = new EmbedBuilder()
        .setTitle("🤖 AI Chime Setup")
        .setDescription(
          `**Current Rate:** ${currentRate}%\n` +
            `**Allowed Channels:** ${currentChannels}\n\n` +
            "➕ **Toggle Channel** to add/remove a channel from the AI-chime pool\n" +
            "🔢 **Set Rate** (0–100%)\n" +
            "↩️ **Back** to main menu"
        )
        .setColor(0x9900cc);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ai_toggleChannel")
          .setLabel("➕ Toggle Channel")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("ai_setRate")
          .setLabel("🔢 Set Rate")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("ai_back")
          .setLabel("↩️ Back")
          .setStyle(ButtonStyle.Secondary)
      );

      // ← Here is the crucial fix: respond to **selectInteraction**, not to interaction
      await selectInteraction.update({
        embeds: [aiEmbed],
        components: [row],
      });

      // ─── Collector for the AI buttons
      const aiButtonCollector = selectInteraction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000,
        filter: (btnInt) =>
          btnInt.user.id === interaction.user.id &&
          ["ai_toggleChannel", "ai_setRate", "ai_back"].includes(btnInt.customId),
        max: 1,
      });

      aiButtonCollector.on("collect", async (btnInt) => {
        // “Back” → re-show main menu
        if (btnInt.customId === "ai_back") {
          return showMainMenu(mainMessage, instance, interaction);
        }

        // “Toggle Channel” → show a ChannelSelectMenu
        if (btnInt.customId === "ai_toggleChannel") {
          const channelSelectRow = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId("ai_channelSelect")
              .setPlaceholder("Pick a channel to toggle in/out of AI-chime pool…")
              .addChannelTypes(0, 5, 15) // GUILD_TEXT, GUILD_ANNOUNCEMENT, GUILD_FORUM
              .setMinValues(1)
              .setMaxValues(1)
          );
          return btnInt.update({
            embeds: [
              new EmbedBuilder()
                .setTitle("🤖 AI Chime: Toggle Channel")
                .setDescription("Select a channel to add/remove from the AI-chime pool.")
                .setColor(0x9900cc),
            ],
            components: [channelSelectRow],
          });
        }

        // “Set Rate” → ask the user to type a number (0–100) in chat
        if (btnInt.customId === "ai_setRate") {
          return btnInt.update({
            embeds: [
              new EmbedBuilder()
                .setTitle("🤖 AI Chime: Set Rate")
                .setDescription(
                  "Please type a **number between 0 and 100** in chat (only you can respond). I’ll capture that and save it."
                )
                .setColor(0x9900cc),
            ],
            components: [],
          });
        }
      });

      // ─── Collector for AI ChannelSelectMenu ───
      const aiChannelCollector = selectInteraction.channel.createMessageComponentCollector({
        componentType: ComponentType.ChannelSelect,
        time: 120000,
        filter: (chanInt) =>
          chanInt.user.id === interaction.user.id && chanInt.customId === "ai_channelSelect",
        max: 1,
      });

      aiChannelCollector.on("collect", async (chanInt) => {
        const picked = chanInt.channels.first().id;
        let settings = existing;
        if (!settings) {
          settings = new AISettings({
            guildId: interaction.guild.id,
            chimeChannelIds: [],
            chimeRate: 0,
          });
        }
        if (!Array.isArray(settings.chimeChannelIds)) {
          settings.chimeChannelIds = [];
        }

        let responseEmbed;
        if (settings.chimeChannelIds.includes(picked)) {
          settings.chimeChannelIds = settings.chimeChannelIds.filter((c) => c !== picked);
          responseEmbed = new EmbedBuilder()
            .setTitle("🤖 AI Chime: Toggle Channel")
            .setDescription(`✅ Removed <#${picked}> from the AI-chime pool.`)
            .setColor(0xcc0000);
        } else {
          settings.chimeChannelIds.push(picked);
          responseEmbed = new EmbedBuilder()
            .setTitle("🤖 AI Chime: Toggle Channel")
            .setDescription(`✅ Added <#${picked}> to the AI-chime pool.`)
            .setColor(0x00bb00);
        }

        try {
          await settings.save();
          return chanInt.update({ embeds: [responseEmbed], components: [] });
        } catch (err) {
          console.error("Error saving AISettings:", err);
          return chanInt.update({
            embeds: [
              new EmbedBuilder()
                .setTitle("🤖 AI Chime: Toggle Channel")
                .setDescription(`⚠️ Could not save changes.\n\`${err.message}\``)
                .setColor(0xcc0000),
            ],
            components: [],
          });
        }
      });

      // ─── Collector for “Set Rate” chat reply ───
      // After “Set Rate” is clicked, we told the user to “type a number 0–100 in chat,”
      // so here we collect that message (only from the invoking user).
      const rateCollector = selectInteraction.channel.createMessageCollector({
        filter: (m) => m.author.id === interaction.user.id && !m.author.bot,
        time: 120000,
        max: 1,
      });

      rateCollector.on("collect", async (msg) => {
        const val = parseInt(msg.content.trim(), 10);
        if (isNaN(val) || val < 0 || val > 100) {
          return msg.reply("❌ Please type a valid number between 0 and 100.");
        }
        let settings = existing;
        if (!settings) {
          settings = new AISettings({
            guildId: interaction.guild.id,
            chimeChannelIds: [],
            chimeRate: val,
          });
        } else {
          settings.chimeRate = val;
        }

        try {
          await settings.save();
          return msg.reply(`✅ AI chime rate set to **${val}%**.`);
        } catch (err) {
          console.error("Error saving AISettings rate:", err);
          return msg.reply(`⚠️ Could not save the rate. \`${err.message}\``);
        }
      });
    }
  });

  collector.on("end", async (collected) => {
    if (collected.size === 0) {
      // If no selection was made within 2 minutes, expire the menu
      const expiredEmbed = new EmbedBuilder()
        .setTitle("⌛ Setup Menu")
        .setDescription("Session expired. Please run `/setupmenu` again.")
        .setColor(0x888888);

      return mainMessage.edit({
        embeds: [expiredEmbed],
        components: [],
      });
    }
  });
}
