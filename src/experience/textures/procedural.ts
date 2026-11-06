import { seededRandom, range } from "@/lib/random";
import { context2d, createCanvas } from "../painters/surface";

export const paintCork = (size: number) => {
  const random = seededRandom("cork");
  const canvas = createCanvas(size, size);
  const ctx = context2d(canvas);
  ctx.fillStyle = "#6a4a2d";
  ctx.fillRect(0, 0, size, size);
  const wrap = (x: number, y: number, r: number, color: string) => {
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        if (x + dx + r < 0 || x + dx - r > size || y + dy + r < 0 || y + dy - r > size) continue;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x + dx, y + dy, r, r * range(random, 0.6, 1), random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  for (let i = 0; i < 40; i++) {
    wrap(random() * size, random() * size, range(random, 0.05, 0.15) * size, `rgba(40, 24, 10, ${range(random, 0.04, 0.09)})`);
  }
  const granules = Math.round(size * size * 0.06);
  for (let i = 0; i < granules; i++) {
    const tone = random();
    const color =
      tone < 0.45
        ? `rgba(${range(random, 40, 70)}, ${range(random, 24, 40)}, ${range(random, 10, 20)}, ${range(random, 0.5, 0.9)})`
        : tone < 0.85
          ? `rgba(${range(random, 140, 175)}, ${range(random, 100, 125)}, ${range(random, 60, 80)}, ${range(random, 0.4, 0.8)})`
          : `rgba(${range(random, 195, 215)}, ${range(random, 160, 175)}, ${range(random, 115, 130)}, ${range(random, 0.3, 0.6)})`;
    wrap(random() * size, random() * size, range(random, 0.6, 2.4) * (size / 1024), color);
  }
  for (let i = 0; i < 160; i++) {
    wrap(random() * size, random() * size, range(random, 1, 2.2) * (size / 1024), "rgba(15, 8, 3, 0.85)");
  }
  return canvas;
};

export const paintWall = (size: number) => {
  const random = seededRandom("wall");
  const canvas = createCanvas(size, size);
  const ctx = context2d(canvas);
  ctx.fillStyle = "#2a2219";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 400; i++) {
    const x = random() * size;
    const y = random() * size;
    const r = range(random, 0.02, 0.12) * size;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    const light = random() < 0.5;
    gradient.addColorStop(0, light ? "rgba(90, 75, 55, 0.08)" : "rgba(5, 3, 1, 0.1)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const image = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (random() - 0.5) * 18;
    image.data[i] += n;
    image.data[i + 1] += n;
    image.data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
};

const TILE_OFFSETS = [-1, 0, 1];

const crumpleCrease = (ctx: CanvasRenderingContext2D, size: number, random: () => number) => {
  const x = random() * size;
  const y = random() * size;
  const angle = random() * Math.PI;
  const length = range(random, 0.18, 0.5) * size;
  const width = range(random, 0.025, 0.07) * size;
  const ridge = random() < 0.55;
  const tone = ridge ? 255 : 0;
  const strength = range(random, 0.12, 0.28);
  for (const ox of TILE_OFFSETS) {
    for (const oy of TILE_OFFSETS) {
      ctx.save();
      ctx.translate(x + ox * size, y + oy * size);
      ctx.rotate(angle);
      ctx.scale(length / width, 1);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
      gradient.addColorStop(0, `rgba(${tone}, ${tone}, ${tone}, ${strength})`);
      gradient.addColorStop(0.18, `rgba(${tone}, ${tone}, ${tone}, ${strength * 0.55})`);
      gradient.addColorStop(1, `rgba(${tone}, ${tone}, ${tone}, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(-width, -width, width * 2, width * 2);
      ctx.restore();
    }
  }
};

export const paintPaperBump = (size: number) => {
  const random = seededRandom("paper-bump");
  const canvas = createCanvas(size, size);
  const ctx = context2d(canvas);
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = 128 + (random() - 0.5) * 24;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = n;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  ctx.filter = `blur(${(size / 1024).toFixed(2)}px)`;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  for (let i = 0; i < 34; i++) crumpleCrease(ctx, size, random);
  ctx.lineCap = "round";
  for (let i = 0; i < size * 1.2; i++) {
    const x = random() * size;
    const y = random() * size;
    const length = range(random, 4, 18) * (size / 512);
    const angle = random() * Math.PI;
    ctx.strokeStyle = random() < 0.5 ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)";
    ctx.lineWidth = range(random, 0.6, 1.4) * (size / 512);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }
  return canvas;
};

const WINDOW_PANE: ReadonlyArray<[number, number]> = [
  [0.15, 0.1],
  [0.83, 0.04],
  [0.89, 0.88],
  [0.09, 0.95],
];
const SLAT_GAP = 0.24;

const paneMask = (size: number) => {
  const mask = createCanvas(size, size);
  const ctx = context2d(mask);
  ctx.filter = `blur(${Math.round(size * 0.012)}px)`;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  for (const [x, y] of WINDOW_PANE) ctx.lineTo(x * size, y * size);
  ctx.closePath();
  ctx.fill();
  return mask;
};

export const paintBlinds = (size: number, slats: number) => {
  const light = createCanvas(size, size);
  const ctx = context2d(light);
  const glow = ctx.createRadialGradient(size * 0.5, size * 0.45, size * 0.1, size * 0.5, size * 0.5, size * 0.62);
  glow.addColorStop(0, "#f4f4f4");
  glow.addColorStop(1, "#bdbdbd");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  const pitch = size / slats;
  ctx.filter = `blur(${Math.max(1, Math.round(pitch * 0.09))}px)`;
  ctx.fillStyle = "#101010";
  for (let i = 0; i < slats; i++) ctx.fillRect(0, (i + 1 - SLAT_GAP) * pitch, size, SLAT_GAP * pitch);
  ctx.filter = "none";
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(paneMask(size), 0, 0);

  const canvas = createCanvas(size, size);
  const out = context2d(canvas);
  out.fillStyle = "#000";
  out.fillRect(0, 0, size, size);
  out.drawImage(light, 0, 0);
  return canvas;
};

export const paintWood = (width: number, height: number, seed = "desk-wood") => {
  const random = seededRandom(seed);
  const canvas = createCanvas(width, height);
  const ctx = context2d(canvas);
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, "#4a2d19");
  base.addColorStop(0.5, "#3d2414");
  base.addColorStop(1, "#4b2e1a");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  for (let plank = 0; plank < 5; plank++) {
    const top = (plank / 5) * height;
    ctx.fillStyle = `rgba(${range(random, 20, 60)}, ${range(random, 10, 30)}, 5, ${range(random, 0.05, 0.18)})`;
    ctx.fillRect(0, top, width, height / 5);
    ctx.fillStyle = "rgba(10, 5, 2, 0.55)";
    ctx.fillRect(0, top, width, Math.max(1, height * 0.004));
  }
  for (let i = 0; i < height * 0.8; i++) {
    const y = random() * height;
    const amplitude = range(random, 1, 10) * (height / 512);
    const frequency = range(random, 0.6, 3);
    const phase = random() * Math.PI * 2;
    const dark = random() < 0.62;
    ctx.strokeStyle = dark
      ? `rgba(18, 9, 3, ${range(random, 0.03, 0.13)})`
      : `rgba(150, 100, 60, ${range(random, 0.02, 0.06)})`;
    ctx.lineWidth = range(random, 0.5, 2.2) * (height / 512);
    ctx.beginPath();
    for (let x = 0; x <= width; x += width / 64) {
      const wave = Math.sin((x / width) * Math.PI * 2 * frequency + phase) * amplitude;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  for (let knot = 0; knot < 4; knot++) {
    const x = random() * width;
    const y = random() * height;
    for (let ring = 6; ring > 0; ring--) {
      ctx.strokeStyle = `rgba(20, 10, 4, ${0.05 + 0.04 * (6 - ring)})`;
      ctx.lineWidth = height * 0.003;
      ctx.beginPath();
      ctx.ellipse(x, y, ring * height * 0.012 * 3, ring * height * 0.012, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  for (let i = 0; i < 26; i++) {
    const x = random() * width;
    const y = random() * height;
    const r = range(random, 0.05, 0.2) * height;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    const ring = random() < 0.5;
    glow.addColorStop(0, ring ? "rgba(255, 230, 200, 0.05)" : "rgba(0, 0, 0, 0.08)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 40; i++) {
    const x = random() * width;
    const y = random() * height;
    ctx.strokeStyle = `rgba(230, 210, 180, ${range(random, 0.04, 0.1)})`;
    ctx.lineWidth = height * 0.0015;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + range(random, 10, 80) * (height / 512), y + range(random, -6, 6) * (height / 512));
    ctx.stroke();
  }
  return canvas;
};
