import { MathUtils, PlaneGeometry } from "three";
import { boundsOf, distanceOutside, pinOffsetOf, sizeOf, toWorld, type Bounds, type PinSpot } from "@/content/geometry";
import type { Evidence, Vec2 } from "@/content/types";
import { wearHeight } from "../wear/height";
import { wearFor, type Wear } from "../wear/profile";
import { cardZ, finishFor, type Finish } from "./layout3d";

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

export interface CardShape {
  item: Evidence;
  index: number;
  finish: Finish;
  wear: Wear;
  occluders: Occluder[];
  pins: PinSpot[];
}

const overlaps = (a: Bounds, b: Bounds, margin: number) =>
  a.minX - margin < b.maxX && b.minX - margin < a.maxX && a.minY - margin < b.maxY && b.minY - margin < a.maxY;

const occludersFor = (evidence: Evidence[], index: number): Occluder[] => {
  const own = boundsOf(evidence[index]);
  return evidence
    .map((item, order) => ({ item, gap: cardZ(order) - cardZ(index) - LAYER_CLEARANCE, order }))
    .filter(({ item, order }) => order > index && overlaps(own, boundsOf(item), OVERLAP_MARGIN))
    .map(({ item, gap }) => ({ item, gap }));
};

export const cardShapesFor = (evidence: Evidence[], pins: Map<string, PinSpot[]>): CardShape[] =>
  evidence.map((item, index) => ({
    item,
    index,
    finish: finishFor(item),
    wear: wearFor(item),
    occluders: occludersFor(evidence, index),
    pins: pins.get(item.id) ?? ["top"],
  }));

const ceilingAt = (occluders: Occluder[], point: Vec2) =>
  occluders.reduce(
    (ceiling, { item, gap }) => Math.min(ceiling, gap + distanceOutside(item, point) * CLEARANCE_SLOPE),
    Number.POSITIVE_INFINITY,
  );

export const localHeight = ({ item, finish, wear, occluders, pins }: CardShape, x: number, y: number) => {
  const { width, height } = sizeOf(item);
  const longest = Math.max(width, height);
  const u = x / width;
  const v = y / height;
  const fromTop = 0.5 - v;
  const settled = finish.lift * fromTop * fromTop + finish.curl * u * u * fromTop * 4;
  const calm = pins.reduce((least, spot) => {
    const [pinX, pinY] = pinOffsetOf(item, spot);
    return Math.min(least, MathUtils.smoothstep(Math.hypot(x - pinX, y - pinY) / longest, ...PIN_CALM));
  }, 1);
  const shaped = calm * (settled + wearHeight(wear, u, v));
  return Math.min(shaped, ceilingAt(occluders, toWorld(item, [x, y])));
};

export const minimumGap = ({ occluders }: CardShape) =>
  occluders.reduce((gap, occluder) => Math.min(gap, occluder.gap), Number.POSITIVE_INFINITY);

export const createCardGeometry = (shape: CardShape) => {
  const { width, height } = sizeOf(shape.item);
  const geometry = new PlaneGeometry(
    width,
    height,
    Math.max(MIN_SEGMENTS, Math.round(width * SEGMENTS_PER_UNIT)),
    Math.max(MIN_SEGMENTS, Math.round(height * SEGMENTS_PER_UNIT)),
  );
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    position.setZ(i, localHeight(shape, position.getX(i), position.getY(i)));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
};
