import type { FontFamilies } from "./fonts";
import { TextLedger } from "./ledger";
import type { Random } from "./random";

export interface Surface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  random: Random;
  fonts: FontFamilies;
  ledger: TextLedger;
  accent: AccentLayer;
}

export class AccentLayer {
  private layer: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null;

  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {}

  get canvas(): HTMLCanvasElement | null {
    return this.layer?.canvas ?? null;
  }

  context(): CanvasRenderingContext2D {
    if (!this.layer) {
      const canvas = createCanvas(this.width, this.height);
      const ctx = context2d(canvas);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.layer = { canvas, ctx };
    }
    return this.layer.ctx;
  }
}

export const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
};

export const context2d = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) throw new Error("Canvas 2D context is unavailable");
  return ctx;
};

export const createSurface = (width: number, height: number, random: Random, fonts: FontFamilies): Surface => {
  const canvas = createCanvas(width, height);
  return {
    canvas,
    ctx: context2d(canvas),
    width: canvas.width,
    height: canvas.height,
    random,
    fonts,
    ledger: new TextLedger(),
    accent: new AccentLayer(canvas.width, canvas.height),
  };
};

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const inset = (rect: Rect, dx: number, dy = dx): Rect => ({
  x: rect.x + dx,
  y: rect.y + dy,
  width: rect.width - dx * 2,
  height: rect.height - dy * 2,
});

export const roundedRect = (ctx: CanvasRenderingContext2D, rect: Rect, radius: number) => {
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
};
