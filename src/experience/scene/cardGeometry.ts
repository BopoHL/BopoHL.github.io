import { MathUtils, PlaneGeometry } from "three";
import { boundsOf, distanceOutside, pinOffsetOf, sizeOf, toWorld, type Bounds } from "@/content/geometry";
import type { Evidence, Vec2 } from "@/content/types";
import { wearHeight } from "../wear/height";
import type { Wear } from "../wear/profile";
import { cardZ, type Finish } from "./layout3d";

const SEGMENTS_PER_UNIT = 12;
const MIN_SEGMENTS = 10;
const PIN_CALM: [number, number] = [0.08, 0.5];
const LAYER_CLEARANCE = 0.002;
const CLEARANCE_SLOPE = 0.6;
const OVERLAP_MARGIN = 0.3;

export interface Occluder {
  item: Evidence;
  gap: number;
}

const overlaps = (a: Bounds, b: Bounds, margin: number) =>
  a.minX - margin < b.maxX && b.minX - margin < a.maxX && a.minY - margin < b.maxY && b.minY - margin < a.maxY;

export const occludersFor = (evidence: Evidence[], index: number): Occluder[] => {
  const own = boundsOf(evidence[index]);
  return evidence
    .map((item, order) => ({ item, gap: cardZ(order) - cardZ(index) - LAYER_CLEARANCE, order }))
    .filter(({ item, order }) => order > index && overlaps(own, boundsOf(item), OVERLAP_MARGIN))
    .map(({ item, gap }) => ({ item, gap }));
};

const ceilingAt = (occluders: Occluder[], point: Vec2) =>
  occluders.reduce(
    (ceiling, { item, gap }) => Math.min(ceiling, gap + distanceOutside(item, point) * CLEARANCE_SLOPE),
    Number.POSITIVE_INFINITY,
  );

interface CardSurface {
  item: Evidence;
  finish: Finish;
  wear: Wear;
  occluders: Occluder[];
}

export const createCardGeometry = ({ item, finish, wear, occluders }: CardSurface) => {
  const { width, height } = sizeOf(item);
  const [pinX, pinY] = pinOffsetOf(item);
  const longest = Math.max(width, height);
  const geometry = new PlaneGeometry(
    width,
    height,
    Math.max(MIN_SEGMENTS, Math.round(width * SEGMENTS_PER_UNIT)),
    Math.max(MIN_SEGMENTS, Math.round(height * SEGMENTS_PER_UNIT)),
  );
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const u = x / width;
    const v = y / height;
    const fromTop = 0.5 - v;
    const settled = finish.lift * fromTop * fromTop + finish.curl * u * u * fromTop * 4;
    const calm = MathUtils.smoothstep(Math.hypot(x - pinX, y - pinY) / longest, ...PIN_CALM);
    const shaped = settled + calm * wearHeight(wear, u, v);
    position.setZ(i, Math.min(shaped, ceilingAt(occluders, toWorld(item, [x, y]))));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
};
