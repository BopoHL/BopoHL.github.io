import { jitter, range, type Random } from "./random";
import type { Surface } from "./surface";

export interface PaperOptions {
  base: string;
  grain?: number;
  fibers?: number;
  mottle?: number;
  burn?: number;
  stains?: number;
}

export const addGrain = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  random: Random,
  amount: number,
) => {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const n = (random() - 0.5) * amount * 255;
    data[i] += n;
    data[i + 1] += n;
    data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);
};

const mottle = ({ ctx, width, height, random }: Surface, strength: number) => {
  const count = 14;
  for (let i = 0; i < count; i++) {
    const x = random() * width;
    const y = random() * height;
    const r = range(random, 0.15, 0.55) * Math.max(width, height);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = random() < 0.6;
    gradient.addColorStop(0, dark ? `rgba(120, 90, 40, ${strength})` : `rgba(255, 250, 235, ${strength * 0.8})`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
};

const fibers = ({ ctx, width, height, random }: Surface, count: number) => {
  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const x = random() * width;
    const y = random() * height;
    const length = range(random, 0.004, 0.02) * width;
    const angle = random() * Math.PI;
    ctx.strokeStyle = random() < 0.5 ? "rgba(90, 70, 40, 0.12)" : "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = Math.max(0.6, width * 0.0008);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(angle) * length * 0.5 + jitter(random, length * 0.3),
      y + Math.sin(angle) * length * 0.5 + jitter(random, length * 0.3),
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length,
    );
    ctx.stroke();
  }
  ctx.restore();
};

export const burnEdges = ({ ctx, width, height }: Surface, strength: number) => {
  const edge = Math.min(width, height) * 0.22;
  const sides: Array<[number, number, number, number]> = [
    [0, 0, edge, 0],
    [width, 0, width - edge, 0],
    [0, 0, 0, edge],
    [0, height, 0, height - edge],
  ];
  for (const [x0, y0, x1, y1] of sides) {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, `rgba(95, 60, 20, ${strength})`);
    gradient.addColorStop(1, "rgba(95, 60, 20, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
};

export const coffeeRing = ({ ctx, width, height, random }: Surface) => {
  const r = range(random, 0.18, 0.3) * Math.min(width, height);
  const x = range(random, r * 0.4, width - r * 0.4);
  const y = range(random, r * 0.4, height - r * 0.4);
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(150, 100, 50, ${range(random, 0.08, 0.16)})`;
    ctx.lineWidth = r * range(random, 0.03, 0.07);
    ctx.beginPath();
    const start = random() * Math.PI * 2;
    ctx.arc(x + jitter(random, r * 0.03), y + jitter(random, r * 0.03), r * range(random, 0.94, 1.02), start, start + range(random, 3.5, 6.2));
    ctx.stroke();
  }
  const fill = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  fill.addColorStop(0, "rgba(160, 110, 60, 0.03)");
  fill.addColorStop(1, "rgba(160, 110, 60, 0.07)");
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const fold = ({ ctx, width, height, random }: Surface, horizontal: boolean) => {
  const position = range(random, 0.35, 0.65);
  ctx.save();
  if (horizontal) {
    const y = height * position;
    const gradient = ctx.createLinearGradient(0, y - height * 0.03, 0, y + height * 0.03);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.48, "rgba(255,255,255,0.18)");
    gradient.addColorStop(0.52, "rgba(60,40,20,0.16)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y - height * 0.03, width, height * 0.06);
  } else {
    const x = width * position;
    const gradient = ctx.createLinearGradient(x - width * 0.03, 0, x + width * 0.03, 0);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.48, "rgba(255,255,255,0.18)");
    gradient.addColorStop(0.52, "rgba(60,40,20,0.16)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - width * 0.03, 0, width * 0.06, height);
  }
  ctx.restore();
};

export const paintPaper = (surface: Surface, options: PaperOptions) => {
  const { ctx, width, height } = surface;
  ctx.save();
  ctx.fillStyle = options.base;
  ctx.fillRect(0, 0, width, height);
  mottle(surface, options.mottle ?? 0.08);
  fibers(surface, options.fibers ?? Math.round((width * height) / 900));
  burnEdges(surface, options.burn ?? 0.18);
  for (let i = 0; i < (options.stains ?? 0); i++) coffeeRing(surface);
  ctx.restore();
  const grain = options.grain ?? 0.05;
  if (grain > 0) addGrain(ctx, width, height, surface.random, grain);
};

export type EdgeStyle = "straight" | "cut" | "torn";

const edgePoints = (
  random: Random,
  from: [number, number],
  to: [number, number],
  style: EdgeStyle,
  scale: number,
): Array<[number, number]> => {
  if (style === "straight") return [from];
  const steps = style === "torn" ? 70 : 9;
  const amplitude = style === "torn" ? scale * 0.012 : scale * 0.006;
  const points: Array<[number, number]> = [];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  const nx = -dy / length;
  const ny = dx / length;
  let drift = 0;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    drift = style === "torn" ? drift * 0.6 + jitter(random, amplitude) : jitter(random, amplitude);
    const offset = i === 0 ? 0 : drift + amplitude;
    points.push([from[0] + dx * t + nx * offset, from[1] + dy * t + ny * offset]);
  }
  return points;
};

export interface Edges {
  top: EdgeStyle;
  right: EdgeStyle;
  bottom: EdgeStyle;
  left: EdgeStyle;
}

export const clipEdges = ({ ctx, width, height, random }: Surface, edges: Edges) => {
  const scale = Math.max(width, height);
  const corners: Array<[number, number]> = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
  const styles = [edges.top, edges.right, edges.bottom, edges.left];
  ctx.beginPath();
  styles.forEach((style, index) => {
    const points = edgePoints(random, corners[index], corners[(index + 1) % 4], style, scale);
    points.forEach(([x, y], i) => (index === 0 && i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  });
  ctx.closePath();
  ctx.clip();
};
