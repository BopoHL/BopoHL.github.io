import { CanvasTexture, SRGBColorSpace } from "three";
import { font, type FontFamilies } from "../painters/fonts";
import { INK } from "../painters/palette";
import { context2d, createCanvas } from "../painters/surface";
import { DIAL, pulsesFor } from "./phoneDial";

const SIZE = 512;

export const holeAngle = (digit: number) => DIAL.firstHole + (pulsesFor(digit) - 1) * DIAL.holeSpacing;

export const HOLE_RADIUS = 0.69;

export const paintDialPlate = (center: string[], fonts: FontFamilies) => {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = context2d(canvas);
  const c = SIZE / 2;
  ctx.fillStyle = "#e9e1cf";
  ctx.beginPath();
  ctx.arc(c, c, c, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font(600, SIZE * 0.07, fonts.typewriter);
  for (let digit = 0; digit <= 9; digit++) {
    const angle = holeAngle(digit);
    const r = c * HOLE_RADIUS;
    ctx.fillText(String(digit), c + Math.cos(angle) * r, c - Math.sin(angle) * r);
  }
  ctx.fillStyle = "#f6f1e4";
  ctx.beginPath();
  ctx.arc(c, c, c * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(28, 26, 23, 0.4)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = INK;
  center.forEach((line, index) => {
    ctx.font = font(index === 0 ? 600 : 400, SIZE * (index === 0 ? 0.05 : 0.045), fonts.typewriter);
    ctx.fillText(line, c, c + (index - (center.length - 1) / 2) * SIZE * 0.07, c * 0.62);
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};
