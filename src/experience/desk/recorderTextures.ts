import { CanvasTexture, SRGBColorSpace } from "three";
import type { TapeKey } from "@/audio/tape";
import { seededRandom, range } from "@/lib/random";
import { font, type FontFamilies } from "../painters/fonts";
import { context2d, createCanvas } from "../painters/surface";

export const CASSETTE = { width: 1.5, depth: 0.95, hubSpacing: 0.63, holeRadius: 0.13, window: { width: 0.36, depth: 0.22 } };
const CASSETTE_PX = 512;
const LABEL = { left: 0.06, right: 1.44, top: 0.05, bottom: 0.7 };
const WINDOW_CENTER = 0.42;

export interface CassetteLabel {
  title: string;
  note: string;
  side: string;
}

const rounded = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
};

export const paintCassetteFace = (label: CassetteLabel, fonts: FontFamilies) => {
  const u = CASSETTE_PX;
  const canvas = createCanvas(CASSETTE.width * u, CASSETTE.depth * u);
  const ctx = context2d(canvas);
  const { width, height } = canvas;

  ctx.fillStyle = "#24221f";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = u * 0.008;
  ctx.strokeRect(u * 0.01, u * 0.01, width - u * 0.02, height - u * 0.02);
  ctx.fillStyle = "#121110";
  for (const [x, y] of [
    [0.05, 0.05],
    [1.45, 0.05],
    [0.05, 0.9],
    [1.45, 0.9],
    [0.75, 0.86],
  ]) {
    ctx.beginPath();
    ctx.arc(x * u, y * u, u * 0.018, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(0.28 * u, height);
  ctx.lineTo(0.36 * u, 0.76 * u);
  ctx.lineTo(1.14 * u, 0.76 * u);
  ctx.lineTo(1.22 * u, height);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.stroke();

  const labelWidth = (LABEL.right - LABEL.left) * u;
  rounded(ctx, LABEL.left * u, LABEL.top * u, labelWidth, (LABEL.bottom - LABEL.top) * u, u * 0.02);
  ctx.fillStyle = "#ece4cf";
  ctx.fill();
  ctx.fillStyle = "#8c2b22";
  ctx.fillRect(LABEL.left * u, 0.555 * u, labelWidth, 0.05 * u);
  ctx.strokeStyle = "rgba(60, 50, 40, 0.35)";
  ctx.lineWidth = u * 0.003;
  for (const y of [0.2, 0.27]) {
    ctx.beginPath();
    ctx.moveTo(0.12 * u, y * u);
    ctx.lineTo(1.38 * u, y * u);
    ctx.stroke();
  }

  ctx.fillStyle = "#1c2440";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = font(700, u * 0.1, fonts.hand);
  ctx.fillText(label.title, 0.14 * u, 0.19 * u, 1.0 * u);
  ctx.font = font(500, u * 0.075, fonts.hand);
  ctx.fillText(label.note, 0.14 * u, 0.67 * u, 1.05 * u);
  ctx.fillStyle = "#ece4cf";
  ctx.font = font(700, u * 0.04, fonts.typewriter);
  ctx.fillText("C-60", 0.12 * u, 0.592 * u);
  ctx.textAlign = "right";
  ctx.fillText(label.side, 1.38 * u, 0.592 * u);
  ctx.fillStyle = "#1c2440";
  ctx.font = font(700, u * 0.12, fonts.hand);
  ctx.fillText("A", 1.36 * u, 0.19 * u);

  ctx.globalCompositeOperation = "destination-out";
  const windowLeft = (CASSETTE.width / 2 - CASSETTE.window.width / 2) * u;
  rounded(ctx, windowLeft, (WINDOW_CENTER - CASSETTE.window.depth / 2) * u, CASSETTE.window.width * u, CASSETTE.window.depth * u, u * 0.03);
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc((CASSETTE.width / 2 + (side * CASSETTE.hubSpacing) / 2) * u, WINDOW_CENTER * u, CASSETTE.holeRadius * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  return canvas;
};

export const CASSETTE_WINDOW_Z = WINDOW_CENTER - CASSETTE.depth / 2;

export const paintGrille = (width: number, height: number) => {
  const random = seededRandom("recorder-grille");
  const canvas = createCanvas(width, height);
  const ctx = context2d(canvas);
  ctx.fillStyle = "#9a9a95";
  ctx.fillRect(0, 0, width, height);
  for (let y = 0; y < height; y += 2) {
    ctx.fillStyle = `rgba(255,255,255,${range(random, 0, 0.06)})`;
    ctx.fillRect(0, y, width, 1);
  }
  const pitch = width / 34;
  const radius = pitch * 0.28;
  ctx.fillStyle = "#0d0d0c";
  for (let row = 1; row * pitch * 0.87 < height - pitch * 0.5; row++) {
    const y = row * pitch * 0.87;
    for (let x = pitch * (row % 2 ? 1 : 1.5); x < width - pitch * 0.5; x += pitch) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return canvas;
};

const SYMBOL_PX = 128;

const drawSymbol = (ctx: CanvasRenderingContext2D, key: TapeKey) => {
  const s = SYMBOL_PX;
  const triangle = (x: number, direction: 1 | -1, size: number) => {
    ctx.beginPath();
    ctx.moveTo(x - (direction * size) / 2, s / 2 - size / 2);
    ctx.lineTo(x + (direction * size) / 2, s / 2);
    ctx.lineTo(x - (direction * size) / 2, s / 2 + size / 2);
    ctx.closePath();
    ctx.fill();
  };
  switch (key) {
    case "record":
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      return;
    case "play":
      triangle(s / 2, 1, s * 0.42);
      return;
    case "rewind":
      triangle(s * 0.38, -1, s * 0.3);
      triangle(s * 0.62, -1, s * 0.3);
      return;
    case "forward":
      triangle(s * 0.38, 1, s * 0.3);
      triangle(s * 0.62, 1, s * 0.3);
      return;
    case "stop":
      ctx.fillRect(s * 0.3, s * 0.3, s * 0.4, s * 0.4);
      return;
    case "pause":
      ctx.fillRect(s * 0.3, s * 0.28, s * 0.13, s * 0.44);
      ctx.fillRect(s * 0.57, s * 0.28, s * 0.13, s * 0.44);
      return;
  }
};

export const paintKeySymbol = (key: TapeKey, color: string) => {
  const canvas = createCanvas(SYMBOL_PX, SYMBOL_PX);
  const ctx = context2d(canvas);
  ctx.fillStyle = color;
  drawSymbol(ctx, key);
  return canvas;
};

export const paintBrandPlate = (brand: string, model: string, fonts: FontFamilies) => {
  const canvas = createCanvas(640, 100);
  const ctx = context2d(canvas);
  const { width, height } = canvas;
  const random = seededRandom("recorder-brand");
  ctx.fillStyle = "#b9b8b2";
  ctx.fillRect(0, 0, width, height);
  for (let y = 0; y < height; y++) {
    ctx.fillStyle = `rgba(0,0,0,${range(random, 0, 0.07)})`;
    ctx.fillRect(0, y, width, 1);
  }
  ctx.fillStyle = "#151515";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = font(900, height * 0.5, fonts.headline);
  ctx.fillText(brand, width * 0.04, height * 0.54, width * 0.6);
  ctx.textAlign = "right";
  ctx.font = font(600, height * 0.26, fonts.typewriter);
  ctx.fillText(model, width * 0.96, height * 0.56, width * 0.32);
  return canvas;
};

export class CounterDisplay {
  readonly texture: CanvasTexture;
  private readonly canvas = createCanvas(192, 64);
  private shown = -1;

  constructor(private readonly fonts: FontFamilies) {
    this.texture = new CanvasTexture(this.canvas);
    this.texture.colorSpace = SRGBColorSpace;
    this.show(0);
  }

  show(value: number) {
    if (value === this.shown) return;
    this.shown = value;
    const ctx = context2d(this.canvas);
    const { width, height } = this.canvas;
    ctx.fillStyle = "#0b0b0a";
    ctx.fillRect(0, 0, width, height);
    const cell = width / 3;
    ctx.font = font(600, height * 0.72, this.fonts.typewriter);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    [...String(value).padStart(3, "0")].forEach((digit, index) => {
      ctx.fillStyle = index % 2 ? "#1d1d1b" : "#161615";
      ctx.fillRect(index * cell + 3, 3, cell - 6, height - 6);
      ctx.fillStyle = "#e9e6dc";
      ctx.fillText(digit, index * cell + cell / 2, height * 0.54);
    });
    this.texture.needsUpdate = true;
  }
}
