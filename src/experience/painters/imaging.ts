import type { EvidenceImage } from "@/content/types";
import type { FontFamilies } from "./fonts";
import { addGrain } from "./paper";
import type { Random } from "./random";
import { paintScene } from "./scenes";
import { context2d, createCanvas, type Rect } from "./surface";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${src}`));
    image.src = src;
  });

const drawCover = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
};

export const renderImage = async (
  image: EvidenceImage,
  width: number,
  height: number,
  random: Random,
  fonts: FontFamilies,
): Promise<HTMLCanvasElement> => {
  const canvas = createCanvas(width, height);
  const ctx = context2d(canvas);
  if (image.src) {
    try {
      drawCover(ctx, await loadImage(image.src), canvas.width, canvas.height);
      return canvas;
    } catch {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  paintScene(image.scene, { ctx, width: canvas.width, height: canvas.height, random, fonts });
  return canvas;
};

export interface GradeOptions {
  warmth: number;
  contrast: number;
  lift: number;
  vignette: number;
  grain: number;
}

export const gradePhoto = (source: HTMLCanvasElement, random: Random, options: GradeOptions): HTMLCanvasElement => {
  const canvas = createCanvas(source.width, source.height);
  const ctx = context2d(canvas);
  ctx.filter = `blur(${Math.max(0.3, source.width / 1400)}px)`;
  ctx.drawImage(source, 0, 0);
  ctx.filter = "none";
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const { warmth, contrast, lift } = options;
  for (let i = 0; i < data.length; i += 4) {
    const luminance = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    const curved = Math.min(1, Math.max(0, (luminance - 0.5) * contrast + 0.5));
    const v = lift + curved * (1 - lift);
    data[i] = 255 * Math.min(1, v * (1 + warmth * 0.12));
    data[i + 1] = 255 * v * (1 + warmth * 0.02);
    data[i + 2] = 255 * v * (1 - warmth * 0.16);
  }
  ctx.putImageData(image, 0, 0);
  const vignette = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    Math.min(canvas.width, canvas.height) * 0.3,
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height) * 0.75,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(20,10,0,${options.vignette})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  addGrain(ctx, canvas.width, canvas.height, random, options.grain);
  return canvas;
};

export const halftone = (
  source: HTMLCanvasElement,
  target: CanvasRenderingContext2D,
  rect: Rect,
  cell: number,
  ink: string,
) => {
  const sample = createCanvas(Math.max(1, Math.round(rect.width / cell)), Math.max(1, Math.round(rect.height / cell)));
  const sctx = context2d(sample);
  sctx.drawImage(source, 0, 0, sample.width, sample.height);
  const data = sctx.getImageData(0, 0, sample.width, sample.height).data;
  const stepX = rect.width / sample.width;
  const stepY = rect.height / sample.height;
  target.save();
  target.beginPath();
  target.rect(rect.x, rect.y, rect.width, rect.height);
  target.clip();
  target.fillStyle = ink;
  for (let y = 0; y < sample.height; y++) {
    for (let x = 0; x < sample.width; x++) {
      const i = (y * sample.width + x) * 4;
      const darkness = 1 - (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      if (darkness < 0.04) continue;
      const offset = y % 2 ? stepX / 2 : 0;
      const radius = Math.sqrt(darkness) * stepX * 0.62;
      target.beginPath();
      target.arc(rect.x + x * stepX + stepX / 2 + offset, rect.y + y * stepY + stepY / 2, radius, 0, Math.PI * 2);
      target.fill();
    }
  }
  target.restore();
};
