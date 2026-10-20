import type { EvidenceImage, PhotoEvidence } from "@/content/types";
import { font } from "../fonts";
import { gradePhoto, renderImage } from "../imaging";
import { HAND_INK, PHOTO_PAPER } from "../palette";
import { paintPaper } from "../paper";
import type { Surface } from "../surface";
import { drawHandwrittenBlock, fitText } from "../text";
import type { PaintJob } from "./job";

const PHOTO_GRADE = { warmth: 0.85, contrast: 1.18, lift: 0.07, vignette: 0.45, grain: 0.07 };

const drawPhoto = async (surface: Surface, image: EvidenceImage, x: number, y: number, w: number, h: number) => {
  const { ctx, random, fonts } = surface;
  const source = await renderImage(image, w, h, random, fonts);
  const graded = gradePhoto(source, random, PHOTO_GRADE);
  ctx.drawImage(graded, x, y, w, h);
  const sheen = ctx.createLinearGradient(x, y, x + w, y + h);
  sheen.addColorStop(0, "rgba(255,255,255,0.07)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, w, h);
};

const paintPolaroid = async ({ item, locale, surface }: PaintJob<PhotoEvidence>) => {
  const { ctx, width: W, height: H, random, fonts } = surface;
  paintPaper(surface, { base: PHOTO_PAPER, grain: 0.03, mottle: 0.06, burn: 0.12 });
  const border = W * 0.065;
  const size = W - border * 2;
  await drawPhoto(surface, item.image, border, border, size, size * 0.98);
  const captionTop = border + size * 0.98;
  const box = { x: border, y: captionTop, width: size, height: H - captionTop - border * 0.4 };
  const fitted = fitText(ctx, item.caption[locale], box, {
    fontAt: (s) => font(700, s, fonts.hand),
    maxSize: (H - captionTop) * 0.5,
    minSize: W * 0.05,
    lineHeight: 1,
  });
  ctx.font = font(700, fitted.size, fonts.hand);
  ctx.textAlign = "center";
  drawHandwrittenBlock(
    ctx,
    fitted.lines,
    W / 2,
    box.y + (box.height - fitted.height) / 2 + fitted.size * 0.8,
    fitted.size,
    fitted.lineHeightPx,
    { color: HAND_INK, random },
  );
  ctx.textAlign = "left";
};

export const paintMugshotPrint = async (surface: Surface, image: EvidenceImage, placard: string) => {
  const { ctx, width: W, height: H, fonts } = surface;
  paintPaper(surface, { base: PHOTO_PAPER, grain: 0.03, mottle: 0.05, burn: 0.1 });
  const border = W * 0.04;
  await drawPhoto(surface, image, border, border, W - border * 2, H - border * 2);

  const plateW = W * 0.62;
  const plateH = H * 0.13;
  const plateX = (W - plateW) / 2;
  const plateY = H - border - plateH - H * 0.04;
  ctx.fillStyle = "#121110";
  ctx.fillRect(plateX, plateY, plateW, plateH);
  ctx.strokeStyle = "rgba(230, 220, 200, 0.4)";
  ctx.lineWidth = Math.max(1, W * 0.004);
  ctx.strokeRect(plateX + plateH * 0.08, plateY + plateH * 0.08, plateW - plateH * 0.16, plateH - plateH * 0.16);
  const fitted = fitText(
    ctx,
    placard.toUpperCase(),
    { x: plateX, y: plateY, width: plateW * 0.86, height: plateH * 0.7 },
    { fontAt: (s) => font(600, s, fonts.stamp), maxSize: plateH * 0.42, minSize: plateH * 0.18, lineHeight: 1.05 },
  );
  ctx.font = font(600, fitted.size, fonts.stamp);
  ctx.fillStyle = "rgba(235, 228, 210, 0.92)";
  ctx.textAlign = "center";
  const top = plateY + (plateH - fitted.height) / 2 + fitted.size * 0.85;
  fitted.lines.forEach((line, index) => ctx.fillText(line, W / 2, top + index * fitted.lineHeightPx));
  ctx.textAlign = "left";
};

export const paintPhoto = async (job: PaintJob<PhotoEvidence>) => {
  if (job.item.frame === "polaroid") return paintPolaroid(job);
  return paintMugshotPrint(job.surface, job.item.image, job.item.caption[job.locale]);
};
