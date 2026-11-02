import type { PlaceholderScene } from "@/content/types";
import { font, type FontFamilies } from "./fonts";
import { jitter, range, type Random } from "@/lib/random";

type Ctx = CanvasRenderingContext2D;

interface SceneArgs {
  ctx: Ctx;
  width: number;
  height: number;
  random: Random;
  fonts: FontFamilies;
}

const gray = (value: number, alpha = 1) => {
  const v = Math.round(Math.max(0, Math.min(255, value)));
  return `rgba(${v},${v},${v},${alpha})`;
};

const verticalGradient = (ctx: Ctx, y0: number, y1: number, stops: Array<[number, string]>) => {
  const gradient = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
};

const glow = (ctx: Ctx, x: number, y: number, radius: number, color: string) => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
};

const person = (ctx: Ctx, x: number, feet: number, tall: number, tone: number, random: Random) => {
  const head = tall * 0.13;
  const shoulders = tall * 0.26;
  ctx.fillStyle = gray(tone);
  ctx.beginPath();
  ctx.ellipse(x, feet - tall + head * 0.5, head * 0.42, head * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - shoulders / 2, feet - tall * 0.78);
  ctx.quadraticCurveTo(x, feet - tall * 0.86, x + shoulders / 2, feet - tall * 0.78);
  ctx.lineTo(x + shoulders * 0.38, feet - tall * 0.42);
  ctx.lineTo(x - shoulders * 0.38, feet - tall * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = tall * 0.075;
  ctx.lineCap = "round";
  ctx.strokeStyle = gray(tone);
  const stride = jitter(random, tall * 0.08);
  ctx.beginPath();
  ctx.moveTo(x - shoulders * 0.18, feet - tall * 0.44);
  ctx.lineTo(x - shoulders * 0.22 + stride, feet);
  ctx.moveTo(x + shoulders * 0.18, feet - tall * 0.44);
  ctx.lineTo(x + shoulders * 0.22 - stride, feet);
  ctx.stroke();
};

const ridge = (random: Random, width: number, base: number, amplitude: number, roughness: number) => {
  const size = 129;
  const points = new Array<number>(size).fill(0);
  points[0] = jitter(random, amplitude);
  points[size - 1] = jitter(random, amplitude);
  let step = size - 1;
  let scale = amplitude;
  while (step > 1) {
    const half = step / 2;
    for (let i = half; i < size; i += step) {
      points[i] = (points[i - half] + points[i + half]) / 2 + jitter(random, scale);
    }
    scale *= roughness;
    step = half;
  }
  return points.map((value, index) => [(index / (size - 1)) * width, base + value] as const);
};

const fillRidge = (ctx: Ctx, points: ReadonlyArray<readonly [number, number]>, height: number, fill: string | CanvasGradient) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (const [x, y] of points) ctx.lineTo(x, y);
  ctx.lineTo(points[points.length - 1][0], height);
  ctx.closePath();
  ctx.fill();
};

const heightChart = ({ ctx, width, height, fonts }: SceneArgs) => {
  ctx.fillStyle = verticalGradient(ctx, 0, height, [
    [0, gray(150)],
    [1, gray(105)],
  ]);
  ctx.fillRect(0, 0, width, height);
  glow(ctx, width * 0.5, height * 0.15, width * 0.75, gray(230, 0.35));
  const rows = 16;
  ctx.font = font(600, height * 0.032, fonts.typewriter);
  ctx.textBaseline = "middle";
  for (let i = 0; i <= rows; i++) {
    const y = (i / rows) * height;
    const major = i % 4 === 0;
    ctx.strokeStyle = gray(45, major ? 0.55 : 0.28);
    ctx.lineWidth = major ? height * 0.006 : height * 0.0025;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    if (major) {
      ctx.fillStyle = gray(40, 0.7);
      const label = String(200 - i * 5);
      ctx.fillText(label, width * 0.03, y - height * 0.025);
      ctx.fillText(label, width * 0.97 - ctx.measureText(label).width, y - height * 0.025);
    }
  }
};

const hoodedFigure = ({ ctx, width, height }: SceneArgs, hood: boolean) => {
  const cx = width * 0.5;
  ctx.save();
  ctx.fillStyle = gray(22);
  ctx.beginPath();
  ctx.moveTo(width * 0.04, height);
  ctx.bezierCurveTo(width * 0.06, height * 0.78, width * 0.2, height * 0.7, cx - width * 0.12, height * 0.66);
  ctx.lineTo(cx + width * 0.12, height * 0.66);
  ctx.bezierCurveTo(width * 0.8, height * 0.7, width * 0.94, height * 0.78, width * 0.96, height);
  ctx.closePath();
  ctx.fill();

  if (hood) {
    const body = ctx.createLinearGradient(cx - width * 0.25, height * 0.15, cx + width * 0.25, height * 0.7);
    body.addColorStop(0, gray(70));
    body.addColorStop(0.35, gray(32));
    body.addColorStop(1, gray(14));
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.25, height * 0.74);
    ctx.bezierCurveTo(cx - width * 0.3, height * 0.42, cx - width * 0.24, height * 0.14, cx, height * 0.13);
    ctx.bezierCurveTo(cx + width * 0.24, height * 0.14, cx + width * 0.3, height * 0.42, cx + width * 0.25, height * 0.74);
    ctx.closePath();
    ctx.fill();

    const face = ctx.createRadialGradient(cx, height * 0.43, 0, cx, height * 0.43, width * 0.15);
    face.addColorStop(0, gray(2));
    face.addColorStop(0.75, gray(6));
    face.addColorStop(1, gray(20, 0));
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.ellipse(cx, height * 0.44, width * 0.125, height * 0.165, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = gray(150, 0.55);
    ctx.lineWidth = width * 0.008;
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.06, height * 0.6);
    ctx.quadraticCurveTo(cx - width * 0.07, height * 0.7, cx - width * 0.055, height * 0.8);
    ctx.moveTo(cx + width * 0.06, height * 0.6);
    ctx.quadraticCurveTo(cx + width * 0.075, height * 0.7, cx + width * 0.06, height * 0.79);
    ctx.stroke();

    ctx.strokeStyle = gray(120, 0.35);
    ctx.lineWidth = width * 0.012;
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.2, height * 0.3);
    ctx.bezierCurveTo(cx - width * 0.16, height * 0.17, cx - width * 0.05, height * 0.145, cx + width * 0.04, height * 0.15);
    ctx.stroke();
  } else {
    const silhouette = new Path2D();
    silhouette.ellipse(cx, height * 0.4, width * 0.118, height * 0.16, 0, 0, Math.PI * 2);
    silhouette.ellipse(cx, height * 0.3, width * 0.128, height * 0.1, 0, Math.PI, Math.PI * 2);
    silhouette.rect(cx - width * 0.055, height * 0.5, width * 0.11, height * 0.18);
    silhouette.ellipse(cx - width * 0.118, height * 0.42, width * 0.018, height * 0.035, 0, 0, Math.PI * 2);
    silhouette.ellipse(cx + width * 0.118, height * 0.42, width * 0.018, height * 0.035, 0, 0, Math.PI * 2);
    ctx.fillStyle = gray(20);
    ctx.fill(silhouette);

    ctx.save();
    ctx.clip(silhouette);
    const rim = ctx.createLinearGradient(cx + width * 0.05, 0, cx + width * 0.14, 0);
    rim.addColorStop(0, gray(20, 0));
    rim.addColorStop(0.75, gray(120, 0.55));
    rim.addColorStop(1, gray(220, 0.9));
    ctx.fillStyle = rim;
    ctx.fillRect(cx, 0, width * 0.2, height);
    ctx.restore();

    ctx.strokeStyle = gray(70, 0.5);
    ctx.lineWidth = width * 0.006;
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.1, height * 0.69);
    ctx.lineTo(cx, height * 0.86);
    ctx.lineTo(cx + width * 0.1, height * 0.69);
    ctx.stroke();
  }
  ctx.restore();
};

const mountains = ({ ctx, width, height, random }: SceneArgs) => {
  ctx.fillStyle = verticalGradient(ctx, 0, height, [
    [0, gray(215)],
    [0.6, gray(180)],
    [1, gray(140)],
  ]);
  ctx.fillRect(0, 0, width, height);
  glow(ctx, width * 0.7, height * 0.25, width * 0.4, gray(250, 0.6));
  const layers = [
    { base: 0.42, amp: 0.16, tone: 165 },
    { base: 0.55, amp: 0.12, tone: 120 },
    { base: 0.68, amp: 0.1, tone: 80 },
    { base: 0.82, amp: 0.07, tone: 40 },
  ];
  layers.forEach((layer, index) => {
    const points = ridge(random, width, height * layer.base, height * layer.amp, 0.55);
    fillRidge(ctx, points, height, gray(layer.tone));
    if (index === 0) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      fillRidge(
        ctx,
        points.map(([x, y]) => [x, y + height * 0.025] as const),
        height,
        gray(layer.tone - 15),
      );
      ctx.restore();
    }
    if (index === layers.length - 1) {
      const peak = points.reduce((best, point) => (point[1] < best[1] ? point : best));
      person(ctx, peak[0], peak[1] + height * 0.005, height * 0.07, 15, random);
    }
  });
};

const marathon = ({ ctx, width, height, random }: SceneArgs) => {
  ctx.fillStyle = verticalGradient(ctx, 0, height, [
    [0, gray(200)],
    [0.5, gray(170)],
    [1, gray(110)],
  ]);
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 14; i++) {
    const w = range(random, 0.05, 0.12) * width;
    const h = range(random, 0.12, 0.3) * height;
    const x = random() * width;
    ctx.fillStyle = gray(range(random, 120, 150));
    ctx.fillRect(x, height * 0.48 - h, w, h);
  }
  ctx.fillStyle = gray(85);
  ctx.beginPath();
  ctx.moveTo(width * 0.42, height * 0.48);
  ctx.lineTo(width * 0.58, height * 0.48);
  ctx.lineTo(width * 1.1, height);
  ctx.lineTo(-width * 0.1, height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = gray(40);
  ctx.fillRect(width * 0.18, height * 0.12, width * 0.025, height * 0.4);
  ctx.fillRect(width * 0.8, height * 0.12, width * 0.025, height * 0.4);
  ctx.fillRect(width * 0.18, height * 0.1, width * 0.645, height * 0.08);
  ctx.fillStyle = gray(200, 0.8);
  for (let i = 0; i < 6; i++) ctx.fillRect(width * (0.26 + i * 0.09), height * 0.125, width * 0.06, height * 0.03);
  const runners = 16;
  for (let i = 0; i < runners; i++) {
    const depth = random();
    const y = height * (0.52 + depth * 0.32);
    const x = width * 0.5 + jitter(random, width * (0.05 + depth * 0.35));
    person(ctx, x, y, height * (0.08 + depth * 0.18), 30 + (1 - depth) * 60, random);
  }
  person(ctx, width * 0.52, height * 1.02, height * 0.55, 18, random);
  ctx.fillStyle = gray(235);
  ctx.fillRect(width * 0.475, height * 0.66, width * 0.09, height * 0.08);
  ctx.fillStyle = gray(30);
  ctx.fillRect(width * 0.49, height * 0.685, width * 0.06, height * 0.03);
};

const phone = ({ ctx, width, height, fonts }: SceneArgs) => {
  ctx.fillStyle = verticalGradient(ctx, 0, height, [
    [0, gray(60)],
    [1, gray(25)],
  ]);
  ctx.fillRect(0, 0, width, height);
  const pw = width * 0.46;
  const ph = height * 0.86;
  const px = (width - pw) / 2;
  const py = height * 0.07;
  ctx.fillStyle = gray(12);
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, pw * 0.12);
  ctx.fill();
  const sx = px + pw * 0.05;
  const sy = py + ph * 0.035;
  const sw = pw * 0.9;
  const sh = ph * 0.93;
  ctx.fillStyle = gray(215);
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, pw * 0.08);
  ctx.fill();
  ctx.fillStyle = gray(80);
  ctx.fillRect(sx, sy + sh * 0.05, sw, sh * 0.1);
  ctx.fillStyle = gray(240);
  ctx.font = font(600, sh * 0.045, fonts.stamp);
  ctx.textBaseline = "middle";
  ctx.fillText("Split the Bill", sx + sw * 0.08, sy + sh * 0.1);
  for (let i = 0; i < 4; i++) {
    const rowY = sy + sh * (0.22 + i * 0.13);
    ctx.fillStyle = gray(150);
    ctx.beginPath();
    ctx.arc(sx + sw * 0.15, rowY, sw * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = gray(120);
    ctx.fillRect(sx + sw * 0.28, rowY - sh * 0.022, sw * 0.32, sh * 0.018);
    ctx.fillStyle = gray(170);
    ctx.fillRect(sx + sw * 0.28, rowY + sh * 0.01, sw * 0.2, sh * 0.014);
    ctx.fillStyle = gray(60);
    ctx.font = font(600, sh * 0.035, fonts.typewriter);
    ctx.fillText(`${(i + 2) * 45}k`, sx + sw * 0.7, rowY);
  }
  ctx.fillStyle = gray(70);
  ctx.beginPath();
  ctx.roundRect(sx + sw * 0.1, sy + sh * 0.8, sw * 0.8, sh * 0.09, sh * 0.03);
  ctx.fill();
  glow(ctx, width * 0.3, height * 0.2, width * 0.5, gray(255, 0.12));
};

const servers = ({ ctx, width, height, random }: SceneArgs) => {
  ctx.fillStyle = gray(30);
  ctx.fillRect(0, 0, width, height);
  const vx = width * 0.5;
  const vy = height * 0.45;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 7; i++) {
      const t0 = i / 7;
      const t1 = (i + 0.85) / 7;
      const x0 = vx + side * (width * 0.55) * (1 - t0);
      const x1 = vx + side * (width * 0.55) * (1 - t1);
      const top0 = vy - height * 0.5 * (1 - t0);
      const bottom0 = vy + height * 0.5 * (1 - t0);
      const top1 = vy - height * 0.5 * (1 - t1);
      const bottom1 = vy + height * 0.5 * (1 - t1);
      ctx.fillStyle = gray(55 + i * 6);
      ctx.beginPath();
      ctx.moveTo(x0, top0);
      ctx.lineTo(x1, top1);
      ctx.lineTo(x1, bottom1);
      ctx.lineTo(x0, bottom0);
      ctx.closePath();
      ctx.fill();
      for (let k = 0; k < 10; k++) {
        if (random() < 0.4) continue;
        const ty = top0 + ((bottom0 - top0) * (k + 0.5)) / 10;
        ctx.fillStyle = gray(240, 0.9);
        ctx.fillRect(x0 + (x1 - x0) * 0.3, ty, Math.max(1, Math.abs(x1 - x0) * 0.08), Math.max(1, height * 0.006));
      }
    }
  }
  ctx.fillStyle = gray(200, 0.6);
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    const w = width * 0.25 * (1 - t);
    ctx.fillRect(vx - w / 2, vy - height * 0.48 * (1 - t), w, height * 0.012 * (1 - t) + 1);
  }
  glow(ctx, vx, vy, width * 0.2, gray(220, 0.5));
};

const corridor = ({ ctx, width, height }: SceneArgs) => {
  const vx = width * 0.5;
  const vy = height * 0.48;
  const ex = width * 0.09;
  const ey = height * 0.12;
  ctx.fillStyle = gray(140);
  ctx.fillRect(0, 0, width, height);
  const plane = (points: Array<[number, number]>, tone: number) => {
    ctx.fillStyle = gray(tone);
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  };
  plane([[0, 0], [vx - ex, vy - ey], [vx - ex, vy + ey], [0, height]], 95);
  plane([[width, 0], [vx + ex, vy - ey], [vx + ex, vy + ey], [width, height]], 75);
  plane([[0, 0], [width, 0], [vx + ex, vy - ey], [vx - ex, vy - ey]], 55);
  plane([[0, height], [width, height], [vx + ex, vy + ey], [vx - ex, vy + ey]], 120);
  plane([[vx - ex, vy - ey], [vx + ex, vy - ey], [vx + ex, vy + ey], [vx - ex, vy + ey]], 235);
  for (let i = 1; i < 6; i++) {
    const t = 1 - i / 6;
    const w = (width * 0.25) * t + ex * 0.6;
    const y = vy - ey - (vy - ey) * t * 0.95;
    ctx.fillStyle = gray(245, 0.9);
    ctx.fillRect(vx - w / 2, y, w, Math.max(1, height * 0.02 * t));
    const doorX = vx - ex - (vx - ex) * t * 0.9;
    const doorTop = vy - ey - (vy - ey) * t * 0.6;
    const doorBottom = vy + ey + (height - vy - ey) * t * 0.98;
    ctx.fillStyle = gray(45, 0.8);
    ctx.fillRect(doorX, doorTop, Math.max(2, width * 0.05 * t), doorBottom - doorTop);
  }
  glow(ctx, vx, vy, width * 0.3, gray(255, 0.35));
};

const students = ({ ctx, width, height, random }: SceneArgs) => {
  ctx.fillStyle = verticalGradient(ctx, 0, height, [
    [0, gray(210)],
    [1, gray(160)],
  ]);
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = gray(110);
  ctx.fillRect(width * 0.12, height * 0.08, width * 0.76, height * 0.55);
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 10; c++) {
      ctx.fillStyle = gray(range(random, 150, 200));
      ctx.fillRect(width * (0.14 + c * 0.072), height * (0.1 + r * 0.088), width * 0.06, height * 0.07);
    }
  }
  ctx.fillStyle = gray(130);
  ctx.fillRect(0, height * 0.63, width, height * 0.37);
  for (let i = 0; i < 8; i++) {
    const x = width * (0.18 + i * 0.09) + jitter(random, width * 0.02);
    person(ctx, x, height * (0.9 + jitter(random, 0.04)), height * range(random, 0.3, 0.36), 25, random);
  }
};

const busStop = ({ ctx, width, height, random }: SceneArgs) => {
  ctx.fillStyle = verticalGradient(ctx, 0, height, [
    [0, gray(205)],
    [1, gray(150)],
  ]);
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = gray(100);
  ctx.fillRect(0, height * 0.72, width, height * 0.28);
  ctx.fillStyle = gray(60);
  ctx.fillRect(width * 0.08, height * 0.2, width * 0.5, height * 0.05);
  ctx.fillRect(width * 0.1, height * 0.2, width * 0.015, height * 0.55);
  ctx.fillRect(width * 0.55, height * 0.2, width * 0.015, height * 0.55);
  ctx.fillStyle = gray(175, 0.6);
  ctx.fillRect(width * 0.115, height * 0.25, width * 0.435, height * 0.35);
  for (let i = 0; i < 4; i++) {
    person(ctx, width * (0.18 + i * 0.1), height * 0.76, height * range(random, 0.36, 0.42), 30, random);
  }
  ctx.fillStyle = gray(70);
  ctx.beginPath();
  ctx.roundRect(width * 0.66, height * 0.32, width * 0.5, height * 0.4, height * 0.04);
  ctx.fill();
  ctx.fillStyle = gray(190);
  for (let i = 0; i < 3; i++) ctx.fillRect(width * (0.69 + i * 0.1), height * 0.37, width * 0.08, height * 0.12);
  ctx.fillStyle = gray(20);
  ctx.beginPath();
  ctx.arc(width * 0.76, height * 0.73, height * 0.05, 0, Math.PI * 2);
  ctx.fill();
};

export const paintScene = (scene: PlaceholderScene, args: SceneArgs) => {
  switch (scene) {
    case "hood":
      heightChart(args);
      hoodedFigure(args, true);
      return;
    case "portrait":
      heightChart(args);
      hoodedFigure(args, false);
      return;
    case "mountains":
      return mountains(args);
    case "marathon":
      return marathon(args);
    case "phone":
      return phone(args);
    case "servers":
      return servers(args);
    case "corridor":
      return corridor(args);
    case "students":
      return students(args);
    case "busStop":
      return busStop(args);
  }
};
