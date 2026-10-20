import { seededRandom, range } from "../painters/random";
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

export const paintBlinds = (size: number) => {
  const canvas = createCanvas(size, size);
  const ctx = context2d(canvas);
  ctx.fillStyle = "#5e5e5e";
  ctx.fillRect(0, 0, size, size);
  const slats = 11;
  const pitch = size / slats;
  ctx.filter = `blur(${Math.round(size * 0.006)}px)`;
  for (let i = 0; i < slats; i++) {
    const gradient = ctx.createLinearGradient(0, i * pitch, 0, i * pitch + pitch * 0.62);
    gradient.addColorStop(0, "#f2f2f2");
    gradient.addColorStop(1, "#d6d6d6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, i * pitch + pitch * 0.12, size, pitch * 0.62);
  }
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(size * 0.47, 0, size * 0.05, size);
  ctx.filter = "none";
  const vignette = ctx.createRadialGradient(size / 2, size / 2, size * 0.25, size / 2, size / 2, size * 0.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);
  return canvas;
};
