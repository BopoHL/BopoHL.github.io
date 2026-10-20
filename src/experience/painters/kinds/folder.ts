import type { FolderEvidence } from "@/content/types";
import { font } from "../fonts";
import { gradePhoto, renderImage } from "../imaging";
import { INK, MANILA, PAPER, PHOTO_PAPER } from "../palette";
import { paintPaper } from "../paper";
import { drawStamp } from "../stamp";
import { createSurface } from "../surface";
import { drawTypewriterLine, fitLines, fitText } from "../text";
import type { PaintJob } from "./job";

export const paintFolder = async ({ item, locale, surface }: PaintJob<FolderEvidence>) => {
  const { ctx, width: W, height: H, random, fonts } = surface;
  const tabH = H * 0.09;
  const tabW = W * 0.46;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, tabH);
  ctx.lineTo(W * 0.02, H * 0.01);
  ctx.quadraticCurveTo(W * 0.025, 0, W * 0.04, 0);
  ctx.lineTo(tabW, 0);
  ctx.quadraticCurveTo(tabW + W * 0.02, 0, tabW + W * 0.03, tabH);
  ctx.lineTo(W, tabH);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.clip();
  paintPaper(surface, { base: MANILA, grain: 0.08, mottle: 0.14, burn: 0.3 });
  ctx.fillStyle = "rgba(60, 40, 10, 0.12)";
  ctx.fillRect(0, tabH, W, H * 0.012);

  ctx.font = font(600, tabH * 0.5, fonts.typewriter);
  drawTypewriterLine(ctx, item.tab[locale], W * 0.05, tabH * 0.72, tabH * 0.5, { color: INK, random });

  const sheet = createSurface(W * 0.56, H * 0.78, random, fonts);
  paintPaper(sheet, { base: PAPER, grain: 0.05, mottle: 0.08, burn: 0.14 });
  const pad = sheet.width * 0.08;
  const name = fitText(sheet.ctx, item.name[locale], { x: pad, y: pad, width: sheet.width - pad * 2, height: sheet.height * 0.3 }, {
    fontAt: (s) => font(900, s, fonts.headline),
    maxSize: sheet.width * 0.13,
    minSize: sheet.width * 0.07,
    lineHeight: 1.05,
  });
  sheet.ctx.fillStyle = INK;
  sheet.ctx.font = font(900, name.size, fonts.headline);
  name.lines.forEach((line, index) => sheet.ctx.fillText(line, pad, pad + name.size + index * name.lineHeightPx));
  let y = pad + name.height + sheet.height * 0.04;
  sheet.ctx.font = font(400, sheet.width * 0.045, fonts.typewriter);
  drawTypewriterLine(sheet.ctx, item.role[locale], pad, y + sheet.width * 0.04, sheet.width * 0.045, { color: INK, random });
  y += sheet.width * 0.09;
  sheet.ctx.fillRect(pad, y, sheet.width - pad * 2, Math.max(1, sheet.width * 0.003));
  y += sheet.width * 0.05;
  const lines = fitLines(sheet.ctx, item.lines[locale], { x: pad, y, width: sheet.width - pad * 2, height: sheet.height - y - pad }, {
    fontAt: (s) => font(400, s, fonts.typewriter),
    maxSize: sheet.width * 0.05,
    minSize: sheet.width * 0.03,
    lineHeight: 1.4,
    paragraphGap: 0.1,
  });
  sheet.ctx.font = font(400, lines.size, fonts.typewriter);
  let cursor = y + lines.size;
  for (const block of lines.blocks) {
    for (const line of block) {
      drawTypewriterLine(sheet.ctx, line, pad, cursor, lines.size, { color: INK, random });
      cursor += lines.lineHeightPx;
    }
  }
  ctx.save();
  ctx.shadowColor = "rgba(30, 15, 0, 0.35)";
  ctx.shadowBlur = W * 0.012;
  ctx.translate(W * 0.4, tabH + H * 0.08);
  ctx.rotate(0.02);
  ctx.drawImage(sheet.canvas, 0, 0);
  ctx.restore();

  const photoW = W * 0.33;
  const photoH = photoW * 1.18;
  const photo = createSurface(photoW, photoH, random, fonts);
  paintPaper(photo, { base: PHOTO_PAPER, grain: 0.03, mottle: 0.05, burn: 0.1 });
  const border = photo.width * 0.06;
  const source = await renderImage(item.image, photo.width - border * 2, photo.width - border * 2, random, fonts);
  photo.ctx.drawImage(
    gradePhoto(source, random, { warmth: 0.85, contrast: 1.15, lift: 0.07, vignette: 0.45, grain: 0.06 }),
    border,
    border,
  );
  ctx.save();
  ctx.shadowColor = "rgba(30, 15, 0, 0.4)";
  ctx.shadowBlur = W * 0.015;
  ctx.translate(W * 0.05, tabH + H * 0.1);
  ctx.rotate(-0.045);
  ctx.drawImage(photo.canvas, 0, 0);
  ctx.restore();
  ctx.strokeStyle = "rgba(200, 200, 205, 0.95)";
  ctx.lineWidth = Math.max(2, W * 0.005);
  ctx.beginPath();
  ctx.roundRect(W * 0.15, tabH + H * 0.05, W * 0.03, H * 0.16, W * 0.015);
  ctx.stroke();

  drawStamp(surface, { text: item.stamp[locale], x: W * 0.27, y: H * 0.87, height: H * 0.14, rotation: -7, opacity: 0.9 });
  ctx.restore();
};
