import { CircleGeometry, Color, Float32BufferAttribute, LatheGeometry, MathUtils, Vector2, Vector3, type BufferGeometry } from "three";
import { fbm } from "@/lib/noise";
import { range, seededRandom } from "@/lib/random";
import { context2d, createCanvas } from "../painters/surface";
import { CIGARETTE_RADIUS } from "./cigaretteModel";

const PROFILE: Array<[number, number]> = [
  [0, 0],
  [0.9, 0],
  [0.97, 0.008],
  [1.0, 0.03],
  [1.035, 0.2],
  [1.05, 0.3],
  [1.045, 0.35],
  [1.025, 0.375],
  [0.99, 0.385],
  [0.88, 0.385],
  [0.83, 0.377],
  [0.8, 0.357],
  [0.76, 0.3],
  [0.7, 0.22],
  [0.62, 0.168],
  [0.5, 0.146],
  [0.3, 0.136],
  [0, 0.132],
];

export const ASHTRAY = {
  rimTop: 0.385,
  floor: 0.132,
  bowlRadius: 0.6,
  notch: { depth: 0.08, halfWidth: 0.075, angles: [30, 150, 270].map(MathUtils.degToRad) },
  rest: { notch: 0, radius: 0.93, contact: 0.36, tilt: MathUtils.degToRad(6) },
};

const SEGMENTS = 200;

const cutNotches = (geometry: BufferGeometry) => {
  const position = geometry.getAttribute("position");
  const { depth, halfWidth, angles } = ASHTRAY.notch;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const radius = Math.hypot(x, z);
    if (radius < 0.72 || y < 0.24) continue;
    const angle = Math.atan2(x, z);
    let cut = 0;
    for (const notch of angles) {
      const offset = radius * Math.abs(MathUtils.euclideanModulo(angle - notch + Math.PI, Math.PI * 2) - Math.PI);
      if (offset < halfWidth) cut = Math.max(cut, Math.sqrt(1 - (offset / halfWidth) ** 2));
    }
    position.setY(i, y - depth * cut * MathUtils.smoothstep(y, 0.24, 0.37));
  }
};

export const createGlassAshtray = (): BufferGeometry => {
  const geometry = new LatheGeometry(
    PROFILE.map(([radius, y]) => new Vector2(radius, y)),
    SEGMENTS,
  );
  cutNotches(geometry);
  geometry.computeVertexNormals();
  return geometry;
};

const INNER_FLOOR = PROFILE.slice(PROFILE.findIndex(([radius]) => radius === 0.7)).reverse();
const ASH_BED = { radius: 0.62, layer: 0.012, mounds: 0.055 };

const innerFloorAt = (radius: number) => {
  for (let i = 1; i < INNER_FLOOR.length; i++) {
    const [r0, y0] = INNER_FLOOR[i - 1];
    const [r1, y1] = INNER_FLOOR[i];
    if (radius <= r1) return MathUtils.mapLinear(radius, r0, r1, y0, y1);
  }
  return INNER_FLOOR[INNER_FLOOR.length - 1][1];
};

const ashReach = (x: number, z: number, seed: number) =>
  ASH_BED.radius * (0.72 + 0.28 * fbm(Math.cos(Math.atan2(z, x)) * 2, Math.sin(Math.atan2(z, x)) * 2, 0, 3, seed + 3));

const ashDepth = (x: number, z: number, seed: number) => {
  const spread = 1 - (Math.hypot(x, z) / ashReach(x, z, seed)) ** 2;
  return Math.max(0, spread) * (ASH_BED.layer + ASH_BED.mounds * fbm(x * 3.2, 0, z * 3.2, 4, seed) ** 1.6);
};

export const ashBedHeight = (x: number, z: number, seed: number) => innerFloorAt(Math.hypot(x, z)) + 0.002 + ashDepth(x, z, seed);

export const createAshBed = (seed: number): BufferGeometry => {
  const geometry = new CircleGeometry(ASH_BED.radius, 96, 0, Math.PI * 2);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.getAttribute("position");
  const colors: number[] = [];
  const color = new Color();
  for (let i = 0; i < position.count; i++) {
    const radius = Math.hypot(position.getX(i), position.getZ(i));
    const reach = radius > 0 ? Math.min(1, ashReach(position.getX(i), position.getZ(i), seed) / ASH_BED.radius) : 1;
    const x = position.getX(i) * reach;
    const z = position.getZ(i) * reach;
    position.setX(i, x);
    position.setZ(i, z);
    const grain = fbm(x * 30, 1, z * 30, 2, seed + 9);
    position.setY(i, ashBedHeight(x, z, seed) + grain * 0.003);
    const shade = 0.55 + 0.45 * MathUtils.clamp(ashDepth(x, z, seed) / (ASH_BED.layer + ASH_BED.mounds * 0.5), 0, 1);
    color.setScalar(shade);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
};

export const paintAsh = (seed: string) => {
  const random = seededRandom(seed);
  const canvas = createCanvas(512, 512);
  const ctx = context2d(canvas);
  const image = ctx.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const mottle = fbm(x / 40, y / 40, 0, 5, 3);
      const fine = fbm(x / 4, y / 4, 1, 2, 5);
      const tone = 70 + 95 * mottle + 40 * (fine - 0.5);
      const index = (y * canvas.width + x) * 4;
      image.data[index] = tone;
      image.data[index + 1] = tone * 0.98;
      image.data[index + 2] = tone * 0.95;
      image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  for (let i = 0; i < 1400; i++) {
    const dark = random() < 0.55;
    ctx.fillStyle = dark ? `rgba(18, 14, 11, ${range(random, 0.5, 0.9)})` : `rgba(215, 212, 205, ${range(random, 0.3, 0.7)})`;
    const size = dark ? range(random, 1, 3.5) : range(random, 1.5, 6);
    ctx.fillRect(random() * canvas.width, random() * canvas.height, size, size * range(random, 0.4, 1));
  }
  return canvas;
};

export interface RestPose {
  position: Vector3;
  yaw: number;
  tilt: number;
  contact: number;
}

export const restPose = (): RestPose => {
  const { notch, radius, contact, tilt } = ASHTRAY.rest;
  const angle = ASHTRAY.notch.angles[notch];
  const outward = new Vector3(Math.sin(angle), 0, Math.cos(angle));
  return {
    position: outward.multiplyScalar(radius).setY(ASHTRAY.rimTop - ASHTRAY.notch.depth + CIGARETTE_RADIUS),
    yaw: Math.atan2(Math.cos(angle), -Math.sin(angle)),
    tilt,
    contact,
  };
};

export const pointAlong = (pose: RestPose, distance: number): Vector3 => {
  const along = distance - pose.contact;
  const horizontal = Math.cos(pose.tilt) * along;
  return pose.position
    .clone()
    .add(new Vector3(Math.cos(pose.yaw) * horizontal, -Math.sin(pose.tilt) * along, -Math.sin(pose.yaw) * horizontal));
};
