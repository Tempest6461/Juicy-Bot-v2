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
  description: "View your level and XP as a rank card image.",
  category: "Levels",
  type: "SLASH",
  guildOnly: true,
  defer: false,

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

    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    const userData = await UserXP.findOne({ userId, guildId });
    if (!userData) {
      return interaction.editReply("❌ You don't have any XP yet.");
    }

    const { level, currentXp } = getLevelFromTotalXp(userData.xp);
    if (userData.level !== level || userData.currentXp !== currentXp) {
      userData.level = level;
      userData.currentXp = currentXp;
      await userData.save();
    }

    const levelTotal = getXpForNextLevel(level);
    const percent = Math.min(currentXp / levelTotal, 1);

    const showRank = level >= 1 && userData.cachedRank !== null;
    const rankText = showRank ? `Rank #${userData.cachedRank}` : "";

    const canvas = Canvas.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(getCachedBackground(), 0, 0);

    const avatarURL = interaction.user.displayAvatarURL({ extension: "png", size: 64 });
    const avatar = await Canvas.loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(140, 150, 90, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 50, 60, 180, 180);
    ctx.restore();

    ctx.font = "bold 36px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(interaction.user.username, 260, 100);

    ctx.font = "28px sans-serif";
    ctx.fillStyle = "#3b82f6";
    ctx.fillText(`Level ${level}`, 260, 150);
    if (showRank) {
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(rankText, 260, 190);
    }

    const barX = 260;
    const barY = 220;
    const barW = 780;
    const barH = 30;

    drawRoundedRect(ctx, barX, barY, barW, barH, 15, "#444");
    drawRoundedRect(ctx, barX, barY, barW * percent, barH, 15, "#3b82f6");

    ctx.font = "20px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${currentXp.toLocaleString()} / ${levelTotal.toLocaleString()} XP`, barX, barY - 10);

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
