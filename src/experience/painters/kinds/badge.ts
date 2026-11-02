import type { BadgeEvidence } from "@/content/types";
import { font } from "../fonts";
import { gradePhoto, renderImage } from "../imaging";
import { AREA_INK, INK } from "../palette";
import { addGrain } from "../paper";
import { range } from "@/lib/random";
import { roundedRect } from "../surface";
import { drawTypewriterLine, fitLines, fitText } from "../text";
import type { PaintJob } from "./job";

const CARD = "#ece6d6";

const sleeveShine = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const shine = ctx.createLinearGradient(0, 0, W, H);
  shine.addColorStop(0, "rgba(255,255,255,0.18)");
  shine.addColorStop(0.35, "rgba(255,255,255,0.02)");
  shine.addColorStop(0.36, "rgba(255,255,255,0.1)");
  shine.addColorStop(0.5, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, W, H);
};

const paintEventBadge = ({ item, locale, surface }: PaintJob<BadgeEvidence>) => {
  const { ctx, width: W, height: H, random, fonts } = surface;
  const radius = W * 0.06;
  roundedRect(ctx, { x: 0, y: 0, width: W, height: H }, radius);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = CARD;
  ctx.fillRect(0, 0, W, H);
  const bandH = H * 0.26;
  ctx.fillStyle = AREA_INK[item.area];
  ctx.fillRect(0, 0, W, bandH);

  ctx.globalCompositeOperation = "destination-out";
  roundedRect(ctx, { x: W * 0.35, y: H * 0.045, width: W * 0.3, height: H * 0.035 }, H * 0.017);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  const header = fitText(
    ctx,
    item.header[locale].toUpperCase(),
    { x: W * 0.08, y: H * 0.1, width: W * 0.84, height: bandH * 0.55 },
    { fontAt: (s) => font(600, s, fonts.stamp), maxSize: W * 0.13, minSize: W * 0.06, lineHeight: 1.05 },
  );
  ctx.fillStyle = "#efe6d2";
  ctx.font = font(600, header.size, fonts.stamp);
  ctx.textAlign = "center";
  const headerTop = H * 0.09 + (bandH - H * 0.09 - header.height) / 2;
  header.lines.forEach((line, index) =>
    ctx.fillText(line, W / 2, headerTop + header.size * 0.85 + index * header.lineHeightPx),
  );

  ctx.fillStyle = INK;
  const title = fitText(
    ctx,
    item.title[locale],
    { x: W * 0.08, y: bandH, width: W * 0.84, height: H * 0.2 },
    { fontAt: (s) => font(900, s, fonts.headline), maxSize: W * 0.16, minSize: W * 0.08, lineHeight: 1.05 },
  );
  ctx.font = font(900, title.size, fonts.headline);
  title.lines.forEach((line, index) => ctx.fillText(line, W / 2, bandH + H * 0.04 + title.size + index * title.lineHeightPx));

  const detailsTop = bandH + H * 0.08 + title.height + H * 0.03;
  const details = fitLines(ctx, item.details[locale], { x: W * 0.1, y: detailsTop, width: W * 0.8, height: H * 0.92 - detailsTop }, {
    fontAt: (s) => font(400, s, fonts.typewriter),
    maxSize: W * 0.075,
    minSize: W * 0.04,
    lineHeight: 1.25,
    paragraphGap: 0.4,
  });
  ctx.font = font(400, details.size, fonts.typewriter);
  let y = detailsTop + details.size;
  for (const block of details.blocks) {
    for (const line of block) {
      const width = ctx.measureText(line).width;
      ctx.textAlign = "left";
      drawTypewriterLine(ctx, line, W / 2 - width / 2, y, details.size, { color: INK, random });
      y += details.lineHeightPx;
    }
    y += details.size * 0.4;
  }
  ctx.fillStyle = AREA_INK[item.area];
  ctx.fillRect(0, H * 0.95, W, H * 0.05);
  addGrain(ctx, W, H, random, 0.014);
  sleeveShine(ctx, W, H);
  ctx.restore();
};

const paintStudentCard = async ({ item, locale, surface }: PaintJob<BadgeEvidence>) => {
  const { ctx, width: W, height: H, random, fonts } = surface;
  roundedRect(ctx, { x: 0, y: 0, width: W, height: H }, H * 0.07);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = CARD;
  ctx.fillRect(0, 0, W, H);
  const bandH = H * 0.22;
  ctx.fillStyle = AREA_INK[item.area];
  ctx.fillRect(0, 0, W, bandH);
  ctx.fillStyle = "#efe6d2";
  ctx.font = font(600, bandH * 0.42, fonts.stamp);
  ctx.textBaseline = "middle";
  ctx.fillText(item.header[locale], W * 0.05, bandH / 2);
  ctx.textBaseline = "alphabetic";

  const photo = { x: W * 0.05, y: bandH + H * 0.08, width: W * 0.27, height: H * 0.6 };
  const source = await renderImage({ scene: "hood" }, photo.width, photo.height, random, fonts);
  ctx.drawImage(gradePhoto(source, random, { warmth: 0.6, contrast: 1.2, lift: 0.06, vignette: 0.4, grain: 0.036 }), photo.x, photo.y, photo.width, photo.height);

  const textX = photo.x + photo.width + W * 0.05;
  ctx.fillStyle = INK;
  ctx.font = font(700, H * 0.095, fonts.headline);
  ctx.fillText(item.title[locale], textX, bandH + H * 0.15);
  const detailsTop = bandH + H * 0.21;
  const details = fitLines(ctx, item.details[locale], { x: textX, y: detailsTop, width: W * 0.94 - textX, height: H * 0.76 - detailsTop }, {
    fontAt: (s) => font(400, s, fonts.typewriter),
    maxSize: H * 0.07,
    minSize: H * 0.035,
    lineHeight: 1.25,
    paragraphGap: 0.15,
  });
  ctx.font = font(400, details.size, fonts.typewriter);
  let y = detailsTop + details.size;
  for (const block of details.blocks) {
    for (const line of block) {
      drawTypewriterLine(ctx, line, textX, y, details.size, { color: INK, random });
      y += details.lineHeightPx;
    }
  }
  const barcodeTop = H * 0.81;
  let x = textX;
  while (x < W * 0.93) {
    const bar = range(random, 0.002, 0.009) * W;
    ctx.fillRect(x, barcodeTop, bar, H * 0.11);
    x += bar + range(random, 0.003, 0.01) * W;
  }
  addGrain(ctx, W, H, random, 0.012);
  sleeveShine(ctx, W, H);
  ctx.restore();
};

export const paintBadge = (job: PaintJob<BadgeEvidence>) =>
  job.item.style === "student" ? paintStudentCard(job) : paintEventBadge(job);
