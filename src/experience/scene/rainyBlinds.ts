import { CanvasTexture } from "three";
import { seededRandom } from "@/lib/random";
import { context2d, createCanvas } from "../painters/surface";
import { paintBlinds } from "../textures/procedural";
import { RainGlass, type RainSettings } from "./rainGlass";

export interface WindowPane {
  size: number;
  slats: number;
  framesPerSecond: number;
  rain: RainSettings;
}

const LONGEST_STEP = 0.25;
const SPRITE = 64;
const RUNNER_STRETCH = 1.3;
const CAUSTIC = 0.5;
const CORE = 0.45;

const paintDropSprite = () => {
  const canvas = createCanvas(SPRITE, SPRITE);
  const ctx = context2d(canvas);
  const half = SPRITE / 2;
  const lens = ctx.createRadialGradient(half, half * 1.12, 0, half, half, half);
  lens.addColorStop(0, "rgba(255, 255, 255, 0)");
  lens.addColorStop(0.4, "rgba(214, 214, 214, 0.55)");
  lens.addColorStop(0.78, "rgba(72, 72, 72, 0.9)");
  lens.addColorStop(1, "rgba(72, 72, 72, 0)");
  ctx.fillStyle = lens;
  ctx.fillRect(0, 0, SPRITE, SPRITE);
  return canvas;
};

const paintCausticSprite = () => {
  const canvas = createCanvas(SPRITE, SPRITE);
  const ctx = context2d(canvas);
  const half = SPRITE / 2;
  const glow = ctx.createRadialGradient(half, half, 0, half, half, half);
  glow.addColorStop(0, "rgba(255, 255, 255, 1)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SPRITE, SPRITE);
  return canvas;
};

const luminanceOf = (canvas: HTMLCanvasElement) => {
  const { data } = context2d(canvas).getImageData(0, 0, canvas.width, canvas.height);
  const light = new Float32Array(canvas.width * canvas.height);
  for (let i = 0; i < light.length; i++) light[i] = data[i * 4] / 255;
  return light;
};

export class RainyBlinds {
  readonly texture: CanvasTexture;
  private readonly size: number;
  private readonly frameTime: number;
  private readonly base: HTMLCanvasElement;
  private readonly light: Float32Array;
  private readonly drop = paintDropSprite();
  private readonly caustic = paintCausticSprite();
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly glass: RainGlass;
  private pending = 0;

  constructor({ size, slats, framesPerSecond, rain }: WindowPane) {
    this.size = size;
    this.frameTime = 1 / framesPerSecond;
    this.base = paintBlinds(size, slats);
    this.light = luminanceOf(this.base);
    this.canvas = createCanvas(size, size);
    this.ctx = context2d(this.canvas);
    this.glass = new RainGlass(seededRandom("rain on the window"), rain);
    this.texture = new CanvasTexture(this.canvas);
    this.paint();
  }

  update(delta: number) {
    this.pending += delta;
    if (this.pending < this.frameTime) return;
    this.glass.step(Math.min(this.pending, LONGEST_STEP));
    this.pending = 0;
    this.paint();
    this.texture.needsUpdate = true;
  }

  dispose() {
    this.texture.dispose();
  }

  private paint() {
    const { ctx, size } = this;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(this.base, 0, 0);
    ctx.globalCompositeOperation = "multiply";
    for (const runner of this.glass.runners) {
      const width = runner.radius * size * 0.8;
      const trail = ctx.createLinearGradient(0, runner.top * size, 0, runner.y * size);
      trail.addColorStop(0, "rgba(100, 100, 100, 0)");
      trail.addColorStop(1, "rgba(100, 100, 100, 0.75)");
      ctx.fillStyle = trail;
      ctx.fillRect(runner.x * size - width / 2, runner.top * size, width, (runner.y - runner.top) * size);
    }
    for (const bead of this.glass.beads) this.stamp(this.drop, bead.x, bead.y, bead.radius, 1);
    for (const runner of this.glass.runners) this.stamp(this.drop, runner.x, runner.y, runner.radius, RUNNER_STRETCH);
    ctx.globalCompositeOperation = "lighter";
    for (const bead of [...this.glass.beads, ...this.glass.runners]) {
      ctx.globalAlpha = CAUSTIC * this.lightAt(bead.x, bead.y);
      this.stamp(this.caustic, bead.x, bead.y + bead.radius * 0.15, bead.radius * CORE, 1);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private lightAt(x: number, y: number) {
    const { size } = this;
    const column = Math.min(size - 1, Math.max(0, Math.floor(x * size)));
    const row = Math.min(size - 1, Math.max(0, Math.floor(y * size)));
    return this.light[row * size + column];
  }

  private stamp(sprite: HTMLCanvasElement, x: number, y: number, radius: number, stretch: number) {
    const { size } = this;
    const extent = radius * size * 2;
    this.ctx.drawImage(sprite, x * size - extent / 2, y * size - (extent * stretch) / 2, extent, extent * stretch);
  }
}
