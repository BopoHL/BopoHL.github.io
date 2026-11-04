import { CanvasTexture, SRGBColorSpace } from "three";
import type { SecretKind } from "@/content/desk";
import { seededRandom } from "@/lib/random";
import { font, type FontFamilies } from "../painters/fonts";
import { HAND_INK, INK, STICKY } from "../painters/palette";
import { context2d, createCanvas } from "../painters/surface";

export const SECRET_SIZE: Record<SecretKind, { width: number; depth: number; thick: number }> = {
  matchbook: { width: 0.55, depth: 0.85, thick: 0.07 },
  ticket: { width: 1.5, depth: 0.62, thick: 0.004 },
  bib: { width: 1.25, depth: 0.95, thick: 0.004 },
  note: { width: 0.9, depth: 0.9, thick: 0.004 },
};

const PX_PER_UNIT = 320;

const texture = (canvas: HTMLCanvasElement) => {
  const result = new CanvasTexture(canvas);
  result.colorSpace = SRGBColorSpace;
  result.anisotropy = 8;
  return result;
};

const speckle = (ctx: CanvasRenderingContext2D, seed: string, count: number) => {
  const random = seededRandom(seed);
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = `rgba(60, 45, 25, ${0.03 + random() * 0.06})`;
    ctx.fillRect(random() * ctx.canvas.width, random() * ctx.canvas.height, 1 + random() * 3, 1 + random() * 3);
  }
};

export const paintSecret = (kind: SecretKind, lines: string[], fonts: FontFamilies) => {
  const size = SECRET_SIZE[kind];
  const canvas = createCanvas(size.width * PX_PER_UNIT, size.depth * PX_PER_UNIT);
  const ctx = context2d(canvas);
  const { width, height } = canvas;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (kind === "matchbook") {
    ctx.fillStyle = "#7c1714";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#e9dcc0";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    ctx.fillStyle = "#efe3c8";
    ctx.font = font(900, width * 0.15, fonts.headline);
    ctx.fillText(lines[0] ?? "", width / 2, height * 0.32, width * 0.84);
    ctx.font = font(400, width * 0.1, fonts.typewriter);
    lines.slice(1).forEach((line, index) => ctx.fillText(line, width / 2, height * (0.58 + index * 0.14), width * 0.84));
    ctx.fillStyle = "#2a1a12";
    ctx.fillRect(0, height * 0.9, width, height * 0.1);
  } else if (kind === "ticket") {
    ctx.fillStyle = "#e7dcbf";
    ctx.fillRect(0, 0, width, height);
    speckle(ctx, "ticket", 900);
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = "rgba(28, 26, 23, 0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.72, 8);
    ctx.lineTo(width * 0.72, height - 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = INK;
    ctx.font = font(600, height * 0.17, fonts.stamp);
    ctx.fillText(lines[0] ?? "", width * 0.36, height * 0.24);
    ctx.font = font(400, height * 0.12, fonts.typewriter);
    lines.slice(1).forEach((line, index) => ctx.fillText(line, width * 0.36, height * (0.52 + index * 0.2), width * 0.66));
    ctx.font = font(600, height * 0.2, fonts.stamp);
    ctx.fillText("№ 404", width * 0.86, height / 2);
  } else if (kind === "bib") {
    ctx.fillStyle = "#f2efe8";
    ctx.fillRect(0, 0, width, height);
    speckle(ctx, "bib", 500);
    ctx.fillStyle = "#1c1a17";
    ctx.fillRect(0, 0, width, height * 0.2);
    ctx.fillStyle = "#f2efe8";
    ctx.font = font(600, height * 0.12, fonts.stamp);
    ctx.fillText(lines[0] ?? "", width / 2, height * 0.1);
    ctx.fillStyle = "#1c1a17";
    ctx.font = font(900, height * 0.48, fonts.headline);
    ctx.fillText(lines[1] ?? "", width / 2, height * 0.6);
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    for (const [x, y] of [
      [0.07, 0.28],
      [0.93, 0.28],
      [0.07, 0.92],
      [0.93, 0.92],
    ]) {
      ctx.beginPath();
      ctx.arc(x * width, y * height, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = STICKY;
    ctx.fillRect(0, 0, width, height);
    speckle(ctx, "note", 400);
    ctx.fillStyle = HAND_INK;
    ctx.font = font(700, height * 0.19, fonts.hand);
    lines.forEach((line, index) => ctx.fillText(line, width / 2, height * (0.38 + index * 0.26), width * 0.9));
  }
  return texture(canvas);
};
