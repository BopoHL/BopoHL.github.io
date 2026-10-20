import type { Crease, Wear } from "../wear/profile";
import { jitter, range, type Random } from "./random";
import { createCanvas, context2d, type Surface } from "./surface";

const ABRADED = "rgba(236, 230, 214, ALPHA)";
const GRIME = "rgba(58, 48, 36, ALPHA)";

const tint = (template: string, alpha: number) => template.replace("ALPHA", alpha.toFixed(3));

const creaseLine = (crease: Crease, width: number, height: number) =>
  crease.axis === "horizontal"
    ? { from: [0, (0.5 - crease.position) * height], to: [width, (0.5 - crease.position) * height], normal: [0, 1] }
    : { from: [(0.5 + crease.position) * width, 0], to: [(0.5 + crease.position) * width, height], normal: [1, 0] };

const wobblyStroke = (
  ctx: CanvasRenderingContext2D,
  random: Random,
  from: number[],
  to: number[],
  normal: number[],
  offset: number,
  wobble: number,
) => {
  const steps = 24;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const drift = offset + jitter(random, wobble);
    const x = from[0] + (to[0] - from[0]) * t + normal[0] * drift;
    const y = from[1] + (to[1] - from[1]) * t + normal[1] * drift;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
};

const paintCrease = ({ ctx, width, height, random }: Surface, crease: Crease) => {
  const { from, to, normal } = creaseLine(crease, width, height);
  const scale = Math.min(width, height);
  const line = Math.max(1, scale * 0.0035);
  const wobble = scale * 0.0012;
  ctx.lineCap = "round";
  ctx.lineWidth = line * 7;
  ctx.strokeStyle = tint(crease.ridge ? ABRADED : GRIME, crease.ridge ? 0.12 : 0.06);
  wobblyStroke(ctx, random, from, to, normal, 0, wobble);
  ctx.lineWidth = line;
  ctx.strokeStyle = tint(GRIME, 0.22);
  wobblyStroke(ctx, random, from, to, normal, line * 0.6, wobble);
  ctx.strokeStyle = tint(ABRADED, 0.45);
  wobblyStroke(ctx, random, from, to, normal, -line * 0.6, wobble);

  ctx.lineWidth = line * 1.6;
  ctx.strokeStyle = tint(ABRADED, 0.6);
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  for (let walked = 0; walked < length; walked += range(random, 0.02, 0.08) * length) {
    const t = walked / length;
    const dash = range(random, 0.01, 0.05);
    const x = from[0] + (to[0] - from[0]) * t;
    const y = from[1] + (to[1] - from[1]) * t;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (to[0] - from[0]) * dash, y + (to[1] - from[1]) * dash);
    ctx.stroke();
  }
};

const edgePoint = (random: Random, width: number, height: number, depth: number) => {
  const side = Math.floor(random() * 4);
  const along = random();
  const inward = random() * depth;
  switch (side) {
    case 0:
      return { x: along * width, y: inward, angle: Math.PI / 2 };
    case 1:
      return { x: width - inward, y: along * height, angle: Math.PI };
    case 2:
      return { x: along * width, y: height - inward, angle: -Math.PI / 2 };
    default:
      return { x: inward, y: along * height, angle: 0 };
  }
};

const paintScuffs = ({ ctx, width, height, random }: Surface, count: number) => {
  const scale = Math.min(width, height);
  for (let i = 0; i < count; i++) {
    const { x, y, angle } = edgePoint(random, width, height, scale * 0.08);
    const radius = range(random, 0.01, 0.045) * scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + jitter(random, 0.6));
    ctx.scale(range(random, 1.2, 3), 1);
    const abraded = random() < 0.6;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, tint(abraded ? ABRADED : GRIME, abraded ? 0.35 : 0.12));
    gradient.addColorStop(1, tint(abraded ? ABRADED : GRIME, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();

    ctx.strokeStyle = tint(GRIME, range(random, 0.1, 0.25));
    ctx.lineWidth = Math.max(1, scale * 0.002);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * radius * 0.6, y + Math.sin(angle) * radius * 0.6);
    ctx.stroke();
  }
};

const paintCrinkles = ({ ctx, width, height, random }: Surface, crumple: number) => {
  const scale = Math.min(width, height);
  const count = Math.round(crumple * 14);
  ctx.lineWidth = Math.max(1, scale * 0.0018);
  for (let i = 0; i < count; i++) {
    let x = random() * width;
    let y = random() * height;
    let angle = random() * Math.PI * 2;
    const points: Array<[number, number]> = [[x, y]];
    for (let segment = 0; segment < 3; segment++) {
      angle += jitter(random, 0.5);
      const length = range(random, 0.04, 0.14) * scale;
      x += Math.cos(angle) * length;
      y += Math.sin(angle) * length;
      points.push([x, y]);
    }
    for (const [shift, color] of [
      [0, tint(GRIME, 0.1)],
      [ctx.lineWidth, tint(ABRADED, 0.18)],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      points.forEach(([px, py], index) => (index === 0 ? ctx.moveTo(px, py + shift) : ctx.lineTo(px, py + shift)));
      ctx.stroke();
    }
  }
};

const paintFade = ({ ctx, width, height, random }: Surface, fade: number) => {
  if (fade <= 0) return;
  for (let i = 0; i < 3; i++) {
    const x = random() * width;
    const y = random() * height;
    const radius = range(random, 0.25, 0.5) * Math.max(width, height);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, tint(ABRADED, fade));
    gradient.addColorStop(1, tint(ABRADED, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
};

const isPristine = (wear: Wear) =>
  wear.creases.length === 0 && wear.scuffs === 0 && wear.crumple === 0 && wear.fade === 0;

export const applyWear = (surface: Surface, wear: Wear) => {
  if (isPristine(wear)) return;
  const { canvas, ctx, width, height } = surface;
  const mask = createCanvas(width, height);
  context2d(mask).drawImage(canvas, 0, 0);
  ctx.save();
  paintFade(surface, wear.fade);
  paintCrinkles(surface, wear.crumple);
  for (const crease of wear.creases) paintCrease(surface, crease);
  paintScuffs(surface, wear.scuffs);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0);
  ctx.restore();
};
