import { CylinderGeometry, LatheGeometry, SphereGeometry, Vector2, type BufferGeometry } from "three";
import type { PinStyle } from "../state/variant";

export const NEEDLE_RADIUS = 0.0065;
const NEEDLE_DEPTH = 0.05;
const RADIAL_SEGMENTS = 40;

const PUSH_PIN_PROFILE: Array<[number, number]> = [
  [0, 0.024],
  [0.072, 0.024],
  [0.078, 0.032],
  [0.072, 0.042],
  [0.045, 0.054],
  [0.03, 0.07],
  [0.028, 0.097],
  [0.034, 0.117],
  [0.046, 0.14],
  [0.05, 0.154],
  [0.046, 0.164],
  [0.028, 0.17],
  [0, 0.172],
];

const MAP_PIN = { radius: 0.052, height: 0.105 };

export interface PinWrap {
  radius: number;
  base: number;
}

export const PIN_WRAP: Record<PinStyle, PinWrap> = {
  push: { radius: 0.03, base: 0.066 },
  map: { radius: NEEDLE_RADIUS, base: 0.014 },
};

export interface PinParts {
  head: BufferGeometry;
  needle: BufferGeometry;
}

const needle = (top: number) => {
  const geometry = new CylinderGeometry(NEEDLE_RADIUS, NEEDLE_RADIUS * 0.6, top + NEEDLE_DEPTH, 10);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, (top - NEEDLE_DEPTH) / 2);
  return geometry;
};

export const createPinParts = (style: PinStyle): PinParts => {
  if (style === "map") {
    const head = new SphereGeometry(MAP_PIN.radius, 32, 24);
    head.translate(0, 0, MAP_PIN.height);
    return { head, needle: needle(MAP_PIN.height) };
  }
  const head = new LatheGeometry(
    PUSH_PIN_PROFILE.map(([radius, height]) => new Vector2(radius, height)),
    RADIAL_SEGMENTS,
  );
  head.rotateX(Math.PI / 2);
  return { head, needle: needle(0.042) };
};
