import type { FontFamilies } from "./fonts";
import type { Random } from "./random";

export interface Surface {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  random: Random;
  fonts: FontFamilies;
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
  return { canvas, ctx: context2d(canvas), width: canvas.width, height: canvas.height, random, fonts };
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
