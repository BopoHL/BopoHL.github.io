import { LatheGeometry, MathUtils, Vector2, type BufferGeometry } from "three";
import { fbm } from "@/lib/noise";
import { range, seededRandom } from "@/lib/random";
import { context2d, createCanvas } from "../painters/surface";

export const CIGARETTE_RADIUS = 0.058;

export type Stretch = "filter" | "paper" | "char" | "ember" | "ash";

export interface Section {
  kind: Stretch;
  length: number;
}

export interface Crush {
  from: number;
  bend: number;
  flatten: number;
}

export interface CigaretteSpec {
  seed: string;
  sections: Section[];
  crush?: Crush;
}

const RADIAL_SEGMENTS = 40;
const STEP = 0.008;
const TIP = 0.035;
const R = CIGARETTE_RADIUS;

export const lengthOf = (spec: CigaretteSpec) => spec.sections.reduce((sum, section) => sum + section.length, 0);

export const startOf = (spec: CigaretteSpec, kind: Stretch) => {
  let cursor = 0;
  for (const section of spec.sections) {
    if (section.kind === kind) return cursor;
    cursor += section.length;
  }
  return cursor;
};

const kindAt = (spec: CigaretteSpec, y: number): Stretch => {
  let cursor = 0;
  for (const section of spec.sections) {
    cursor += section.length;
    if (y <= cursor + 1e-6) return section.kind;
  }
  return spec.sections[spec.sections.length - 1].kind;
};

const radiusAt = (kind: Stretch) => {
  switch (kind) {
    case "char":
      return R * 0.975;
    case "ember":
      return R * 0.95;
    case "ash":
      return R * 1.04;
    default:
      return R;
  }
};

const profileOf = (spec: CigaretteSpec) => {
  const total = lengthOf(spec);
  const endsInAsh = spec.sections[spec.sections.length - 1].kind === "ash";
  const points: Vector2[] = [new Vector2(0, 0), new Vector2(R * 0.96, 0), new Vector2(R, 0.006)];
  for (let y = STEP; y < total - TIP; y += STEP) points.push(new Vector2(radiusAt(kindAt(spec, y)), y));
  const last = radiusAt(kindAt(spec, total));
  if (endsInAsh) {
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      points.push(new Vector2(last * Math.cos((t * Math.PI) / 2) ** 0.6, total - TIP + TIP * t));
    }
  } else {
    points.push(new Vector2(last, total - 0.004), new Vector2(last * 0.6, total), new Vector2(0, total));
  }
  return { points, total };
};

const roughenAsh = (geometry: BufferGeometry, spec: CigaretteSpec, seed: number) => {
  const position = geometry.getAttribute("position");
  const ashStart = startOf(spec, "ash");
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    if (y < ashStart) continue;
    const grain = fbm(x * 40, y * 40, z * 40, 3, seed) - 0.5;
    const layer = Math.sin(((y - ashStart) / 0.024) * Math.PI) ** 8;
    const scale = 1 + grain * 0.24 - layer * 0.05;
    position.setXYZ(i, x * scale, y + grain * 0.004, z * scale);
  }
};

const crushEnd = (geometry: BufferGeometry, crush: Crush, total: number, seed: number) => {
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    let x = position.getX(i);
    let y = position.getY(i);
    let z = position.getZ(i);
    if (y > crush.from) {
      const s = (y - crush.from) / (total - crush.from);
      const squash = 1 - crush.flatten * MathUtils.smoothstep(s, 0.2, 1);
      const wrinkle = (fbm(x * 30, y * 30, z * 30, 3, seed) - 0.5) * 0.35 * s;
      x *= squash * (1 + wrinkle);
      z *= (1 + (1 - squash) * 0.45) * (1 + wrinkle);
      const angle = crush.bend * s * s;
      const along = y - crush.from;
      y = crush.from + along * Math.cos(angle) - z * Math.sin(angle);
      z = along * Math.sin(angle) + z * Math.cos(angle);
    }
    position.setXYZ(i, x, y, z);
  }
};

const lengthwiseUv = (geometry: BufferGeometry, total: number) => {
  const position = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) uv.setY(i, MathUtils.clamp(position.getY(i) / total, 0, 1));
};

export const createCigarette = (spec: CigaretteSpec): BufferGeometry => {
  const { points, total } = profileOf(spec);
  const seed = Math.floor(seededRandom(spec.seed)() * 1e6);
  const geometry = new LatheGeometry(points, RADIAL_SEGMENTS);
  lengthwiseUv(geometry, total);
  roughenAsh(geometry, spec, seed);
  if (spec.crush) crushEnd(geometry, spec.crush, total, seed);
  geometry.rotateZ(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
};

export const createEmberBand = (spec: CigaretteSpec): BufferGeometry => {
  const from = startOf(spec, "ember") - 0.006;
  const to = startOf(spec, "ash") + 0.01;
  const geometry = new LatheGeometry(
    [new Vector2(R * 1.004, from), new Vector2(R * 0.99, (from + to) / 2), new Vector2(R * 1.03, to)],
    RADIAL_SEGMENTS,
  );
  geometry.rotateZ(-Math.PI / 2);
  return geometry;
};

const TEXTURE = { around: 128, along: 1024 };

const COLORS = {
  filter: ["#7e5128", "#5e3a1a", "#a3743f"],
  paper: "#f2f0ea",
  band: "#c9a65a",
  ash: ["#7b7771", "#5a5651", "#3a3734"],
} as const;

export const paintCigarette = (spec: CigaretteSpec) => {
  const total = lengthOf(spec);
  const random = seededRandom(`${spec.seed}-paint`);
  const canvas = createCanvas(TEXTURE.around, TEXTURE.along);
  const ctx = context2d(canvas);
  const { width, height } = canvas;
  const rowOf = (y: number) => height * (1 - y / total);
  const band = (from: number, to: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, rowOf(to), width, rowOf(from) - rowOf(to));
  };

  let cursor = 0;
  for (const { kind, length } of spec.sections) {
    const from = cursor;
    const to = cursor + length;
    cursor = to;
    if (kind === "filter") {
      band(from, to, COLORS.filter[0]);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = random() < 0.6 ? COLORS.filter[1] : COLORS.filter[2];
        ctx.globalAlpha = range(random, 0.25, 0.7);
        ctx.fillRect(random() * width, rowOf(from + random() * length), range(random, 1, 3), range(random, 1, 3));
      }
      ctx.globalAlpha = 1;
      band(to - 0.012, to - 0.009, COLORS.band);
      band(to - 0.006, to - 0.004, COLORS.band);
    } else if (kind === "paper") {
      band(from, to, COLORS.paper);
      ctx.fillStyle = "rgba(120, 110, 95, 0.05)";
      for (let row = rowOf(to); row < rowOf(from); row += 3) ctx.fillRect(0, row, width, 1);
      ctx.fillStyle = "rgba(90, 80, 70, 0.12)";
      ctx.fillRect(width * 0.48, rowOf(to), 2, rowOf(from) - rowOf(to));
      const tobacco = ctx.createLinearGradient(0, 0, width, 0);
      tobacco.addColorStop(0, "rgba(150, 110, 60, 0.05)");
      tobacco.addColorStop(0.5, "rgba(150, 110, 60, 0.12)");
      tobacco.addColorStop(1, "rgba(150, 110, 60, 0.05)");
      ctx.fillStyle = tobacco;
      ctx.fillRect(0, rowOf(to), width, rowOf(from) - rowOf(to));
    } else if (kind === "char") {
      for (let x = 0; x < width; x++) {
        const edge = from + length * (0.15 + 0.7 * fbm(x / 9, 0, 0, 3, 11));
        const gradient = ctx.createLinearGradient(0, rowOf(from), 0, rowOf(to));
        const start = (edge - from) / length;
        gradient.addColorStop(0, COLORS.paper);
        gradient.addColorStop(Math.max(0, start - 0.25), "#d9c08a");
        gradient.addColorStop(start, "#6e4423");
        gradient.addColorStop(Math.min(1, start + 0.12), "#1c130d");
        gradient.addColorStop(1, "#120d0a");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, rowOf(to), 1, rowOf(from) - rowOf(to));
      }
    } else if (kind === "ember") {
      band(from, to, "#2a120b");
    } else {
      band(from, to, COLORS.ash[0]);
      for (let y = from; y < to; y += 0.004) {
        const shade = fbm(0, y * 60, 0, 3, 5);
        ctx.fillStyle = shade > 0.55 ? COLORS.ash[1] : "rgba(225, 222, 216, 0.6)";
        ctx.globalAlpha = Math.abs(shade - 0.5) * 1.6;
        ctx.fillRect(0, rowOf(y + 0.004), width, rowOf(y) - rowOf(y + 0.004));
      }
      for (let i = 0; i < 500; i++) {
        ctx.fillStyle = random() < 0.5 ? COLORS.ash[2] : "#e8e5df";
        ctx.globalAlpha = range(random, 0.2, 0.6);
        ctx.fillRect(random() * width, rowOf(from + random() * length), range(random, 1, 4), range(random, 1, 2));
      }
      ctx.globalAlpha = 1;
      const scorched = ctx.createLinearGradient(0, rowOf(from), 0, rowOf(from + length * 0.25));
      scorched.addColorStop(0, "rgba(40, 32, 28, 0.85)");
      scorched.addColorStop(1, "rgba(40, 32, 28, 0)");
      ctx.fillStyle = scorched;
      ctx.fillRect(0, rowOf(from + length * 0.25), width, rowOf(from) - rowOf(from + length * 0.25));
    }
  }
  if (spec.crush) stubOut(ctx, rowOf(spec.crush.from), random);
  return canvas;
};

const stubOut = (ctx: CanvasRenderingContext2D, crushRow: number, random: () => number) => {
  const { width } = ctx.canvas;
  const yellowing = ctx.createLinearGradient(0, crushRow, 0, 0);
  yellowing.addColorStop(0, "rgba(170, 140, 80, 0.25)");
  yellowing.addColorStop(1, "rgba(120, 95, 60, 0.45)");
  ctx.fillStyle = yellowing;
  ctx.fillRect(0, 0, width, crushRow);
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(60, 55, 50, ${range(random, 0.15, 0.4)})`;
    ctx.beginPath();
    ctx.ellipse(random() * width, random() * crushRow, range(random, 3, 12), range(random, 2, 8), random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
};

export const paintEmber = () => {
  const canvas = createCanvas(256, 64);
  const ctx = context2d(canvas);
  const image = ctx.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const along = y / canvas.height;
      const ridge = 1 - Math.abs(fbm(x / 14, y / 10, 0, 4, 21) * 2 - 1);
      const core = Math.sin(along * Math.PI) ** 0.7;
      const heat = MathUtils.clamp(MathUtils.smoothstep(ridge, 0.9 - 0.1 * core, 0.985) * core, 0, 1);
      const index = (y * canvas.width + x) * 4;
      image.data[index] = 255;
      image.data[index + 1] = Math.round(70 + 150 * heat ** 2);
      image.data[index + 2] = Math.round(30 * heat ** 3);
      image.data[index + 3] = Math.round(255 * heat);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
};
