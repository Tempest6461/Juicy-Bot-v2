// src/commands/levels/rank.js

const { AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");
const UserXP = require("../../../command-handler/models/user-xp-schema");
const { getXpForNextLevel, getLevelFromTotalXp } = require("../../../command-handler/util/xpUtils");

const CANVAS_WIDTH = 1100;
const CANVAS_HEIGHT = 300;
let cachedBackground = null;

function getCachedBackground() {
  if (cachedBackground) return cachedBackground;
  const bg = Canvas.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = bg.getContext("2d");
  ctx.fillStyle = "#2d2d2d";
  ctx.fillRect(0, 0, bg.width, bg.height);
  cachedBackground = bg;
  return cachedBackground;
}

module.exports = {
  name: "rank",
  description: "View your level and XP as a rank card image (or mention another user to see theirs).",
  category: "Levels",
  type: "SLASH",
  guildOnly: true,

  // ── Add an optional USER parameter called "user" ──
  options: [
    {
      name: "user",
      description: "The user whose rank card you want to view.",
      type: 6,      // 6 === ApplicationCommandOptionType.User
      required: false,
    },
  ],

  callback: async ({ interaction }) => {
    const start = Date.now();

    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }
    } catch (err) {
      console.warn("❌ Failed to defer reply:", err.message);
      return;
    }

    // ── Determine target (either the mentioned user, or the invoker) ──
    const target = interaction.options.getUser("user") || interaction.user;
    const userId = target.id;
    const guildId = interaction.guild.id;

    // ── Fetch that user’s XP record ──
    const userData = await UserXP.findOne({ userId, guildId });
    if (!userData) {
      // If they have no XP yet, notify
      return interaction.editReply(`❌ ${target.username} does not have any XP yet.`);
    }

    // ── Recalculate level/currentXp in case it’s out of sync ──
    const { level, currentXp } = getLevelFromTotalXp(userData.xp);
    if (userData.level !== level || userData.currentXp !== currentXp) {
      userData.level = level;
      userData.currentXp = currentXp;
      await userData.save();
    }

    // ── Calculate how much XP is needed for the next level ──
    const levelTotal = getXpForNextLevel(level);
    const percent = Math.min(currentXp / levelTotal, 1);

    // ── Only show a “Rank #” if they are level ≥ 1 and have cachedRank defined ──
    const showRank = level >= 1 && userData.cachedRank !== null;
    const rankText = showRank ? `Rank #${userData.cachedRank}` : "";

    // ── Build the canvas ──
    const canvas = Canvas.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const ctx = canvas.getContext("2d");

    // 1) Draw background
    ctx.drawImage(getCachedBackground(), 0, 0);

    // 2) Load and draw the user’s avatar
    const avatarURL = target.displayAvatarURL({ extension: "png", size: 128 });
    const avatar = await Canvas.loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(140, 150, 90, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 50, 60, 180, 180);
    ctx.restore();

    // 3) Draw username
    ctx.font = "bold 36px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(target.username, 260, 100);

    // 4) Draw “Level X” text
    ctx.font = "28px sans-serif";
    ctx.fillStyle = "#3b82f6";
    ctx.fillText(`Level ${level}`, 260, 150);

    // 5) Draw rank text if available
    if (showRank) {
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(rankText, 260, 190);
    }

    // 6) Draw XP progress bar background & foreground
    const barX = 260;
    const barY = 220;
    const barW = 780;
    const barH = 30;
    drawRoundedRect(ctx, barX, barY, barW, barH, 15, "#444");            // background
    drawRoundedRect(ctx, barX, barY, barW * percent, barH, 15, "#3b82f6"); // filled

    // 7) Draw XP text (e.g. “1,234 / 5,000 XP”)
    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${currentXp.toLocaleString()} / ${levelTotal.toLocaleString()} XP`, barX, barY - 10);

    // ── Convert to buffer and send as an attachment ──
    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.85 });
    const attachment = new AttachmentBuilder(buffer, { name: "rank.jpg" });

    if (!interaction.deferred && !interaction.replied) {
      console.warn("❌ Interaction was not acknowledged. Aborting editReply.");
      return;
    }

    try {
      await interaction.editReply({ files: [attachment] });
      // console.log(`✅ /rank rendered in ${Date.now() - start}ms`);
    } catch (err) {
      console.warn("❌ Failed to edit reply:", err.message);
    }
  },
};

function drawRoundedRect(ctx, x, y, w, h, r, color) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
