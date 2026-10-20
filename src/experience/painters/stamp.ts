import { font } from "./fonts";
import { range } from "./random";
import { createSurface, type Surface } from "./surface";

export const STAMP_RED = "#a3161a";

export interface StampOptions {
  text: string;
  x: number;
  y: number;
  height: number;
  rotation: number;
  color?: string;
  opacity?: number;
}

const erode = (surface: Surface, amount: number) => {
  const { ctx, width, height, random } = surface;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  const count = Math.round(width * height * 0.004 * amount);
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = range(random, 0.2, 0.9);
    const r = range(random, 0.4, 2.4) * (height / 60);
    ctx.beginPath();
    ctx.arc(random() * width, random() * height, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 5; i++) {
    const gradient = ctx.createLinearGradient(random() * width, 0, random() * width, height);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.5, `rgba(0,0,0,${range(random, 0.15, 0.45)})`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
};

export const drawStamp = (target: Surface, options: StampOptions) => {
  const color = options.color ?? STAMP_RED;
  const measure = target.ctx;
  const textSize = options.height * 0.56;
  measure.save();
  measure.font = font(600, textSize, target.fonts.stamp);
  const textWidth = measure.measureText(options.text.toUpperCase()).width;
  measure.restore();

  const padding = options.height * 0.32;
  const stamp = createSurface(textWidth + padding * 2, options.height, target.random, target.fonts);
  const { ctx, width, height } = stamp;
  const border = Math.max(2, height * 0.06);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = border;
  ctx.strokeRect(border, border, width - border * 2, height - border * 2);
  ctx.lineWidth = border * 0.45;
  ctx.strokeRect(border * 2.6, border * 2.6, width - border * 5.2, height - border * 5.2);
  ctx.font = font(600, textSize, target.fonts.stamp);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(options.text.toUpperCase(), width / 2, height / 2 + height * 0.03);
  erode(stamp, 1);

  const t = target.ctx;
  t.save();
  t.globalCompositeOperation = "multiply";
  t.globalAlpha = options.opacity ?? 0.85;
  t.translate(options.x, options.y);
  t.rotate((options.rotation * Math.PI) / 180);
  t.drawImage(stamp.canvas, -width / 2, -height / 2);
  t.restore();
};
