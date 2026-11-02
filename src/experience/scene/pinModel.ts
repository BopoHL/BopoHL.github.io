import { CylinderGeometry, LatheGeometry, SphereGeometry, Vector2, type BufferGeometry } from "three";
import type { PinStyle } from "../state/variant";

const NEEDLE_RADIUS = 0.0065;
const NEEDLE_DEPTH = 0.05;
const RADIAL_SEGMENTS = 40;

const PUSH_PIN_PROFILE: Array<[number, number]> = [
  [0, 0.012],
  [0.072, 0.012],
  [0.078, 0.02],
  [0.072, 0.03],
  [0.045, 0.042],
  [0.03, 0.058],
  [0.028, 0.085],
  [0.034, 0.105],
  [0.046, 0.128],
  [0.05, 0.142],
  [0.046, 0.152],
  [0.028, 0.158],
  [0, 0.16],
];

const MAP_PIN = { radius: 0.052, height: 0.105 };

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
  return { head, needle: needle(0.03) };
};
