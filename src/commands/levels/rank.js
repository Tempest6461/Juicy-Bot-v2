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

  options: [
    {
      name: "user",
      description: "The user whose rank card you want to view.",
      type: 6, // USER
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

    // 1) Determine target (either the mentioned user or the invoker)
    const target = interaction.options.getUser("user") || interaction.user;
    const userId = target.id;
    const guildId = interaction.guild.id;

    // 2) Fetch that user's XP record
    const userData = await UserXP.findOne({ userId, guildId });
    if (!userData) {
      return interaction.editReply(`❌ ${target.username} does not have any XP yet.`);
    }

    // 3) Recompute level/currentXp in case it’s out of sync
    const { level, currentXp } = getLevelFromTotalXp(userData.xp);
    if (userData.level !== level || userData.currentXp !== currentXp) {
      userData.level = level;
      userData.currentXp = currentXp;
      await userData.save();
    }

    // 4) Calculate how much XP is needed for the next level
    const levelTotal = getXpForNextLevel(level);
    let percent = currentXp / levelTotal;
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;

    // 5) Decide whether to show "Rank #"
    const showRank = level >= 1 && userData.cachedRank !== null;
    const rankText = showRank ? `Rank #${userData.cachedRank}` : "";

    // ── Build the canvas ──
    const canvas = Canvas.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const ctx = canvas.getContext("2d");

    // a) Draw background
    ctx.drawImage(getCachedBackground(), 0, 0);

    // b) Load and draw the user's avatar
    const avatarURL = target.displayAvatarURL({ extension: "png", size: 128 });
    const avatar = await Canvas.loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(140, 150, 90, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 50, 60, 180, 180);
    ctx.restore();

    // c) Draw username
    ctx.font = "bold 36px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(target.username, 260, 100);

    // d) Draw "Level X" text (grey if level 0, blue otherwise)
    ctx.font = "28px sans-serif";
    ctx.fillStyle = level === 0 ? "#9CA3AF" : "#3b82f6";
    ctx.fillText(`Level ${level}`, 260, 150);

    // e) Draw rank text if available
    if (showRank) {
      ctx.font = "24px sans-serif";
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(rankText, 260, 190);
    }

    // f) Draw XP progress bar background
    const barX = 260;
    const barY = 220;
    const barW = 780;
    const barH = 30;
    drawRoundedRect(ctx, barX, barY, barW, barH, 15, "#444");

    // g) Draw XP progress bar **only** if percent > 0
    if (percent > 0) {
      // g.1) Compute the filled width, clamping to a small minimum if needed
      let fillW = barW * percent;
      if (fillW < 15) fillW = 15;

      // g.2) Draw the filled portion
      drawRoundedRect(ctx, barX, barY, fillW, barH, 15, "#3b82f6");
    }

    // h) Draw XP text above the bar ("0 / 100 XP" or "5 / 295 XP")
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
