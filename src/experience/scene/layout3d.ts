import { Euler, MathUtils, Vector3 } from "three";
import { pinOffsetOf, type PinSpot } from "@/content/geometry";
import type { Area, Evidence } from "@/content/types";
import { seededRandom } from "@/lib/random";

export const CARD_BASE_Z = 0.03;
export const CARD_LAYER_STEP = 0.008;

export const cardZ = (index: number) => CARD_BASE_Z + index * CARD_LAYER_STEP;

export const pinLocal = (item: Evidence, spot: PinSpot): [number, number, number] => [...pinOffsetOf(item, spot), 0];

const MAX_PIN_TILT = 0.07;
const Z_AXIS = new Vector3(0, 0, 1);

export const pinTilt = (item: Evidence, spot: PinSpot): [number, number, number] => {
  const random = seededRandom(`${item.id}-${spot}-pin`);
  return [(random() * 2 - 1) * MAX_PIN_TILT, (random() * 2 - 1) * MAX_PIN_TILT, 0];
};

export const pinAxis = (item: Evidence, spot: PinSpot): Vector3 =>
  Z_AXIS.clone()
    .applyEuler(new Euler(...pinTilt(item, spot)))
    .applyAxisAngle(Z_AXIS, MathUtils.degToRad(item.rotation));

export const PIN_COLORS: Record<Area, string> = {
  case: "#ffd21f",
  work: "#e3262b",
  study: "#2f6fe8",
  hobby: "#2fa84f",
};

export const THREAD_COLORS: Record<Exclude<Area, "case">, string> = {
  work: "#b0181d",
  study: "#3a6fd0",
  hobby: "#3f7d39",
};

export interface Finish {
  roughness: number;
  bumpScale: number;
  lift: number;
  curl: number;
}

export const finishFor = (item: Evidence): Finish => {
  switch (item.kind) {
    case "photo":
      return item.frame === "mugshot"
        ? { roughness: 0.42, bumpScale: 0.2, lift: 0, curl: 0 }
        : { roughness: 0.42, bumpScale: 0.2, lift: 0.04, curl: 0.03 };
    case "badge":
      return { roughness: 0.28, bumpScale: 0.05, lift: 0.03, curl: 0.0 };
    case "sticky":
      return { roughness: 0.78, bumpScale: 0.6, lift: 0.14, curl: 0.04 };
    case "newspaper":
      return { roughness: 0.92, bumpScale: 1, lift: 0.08, curl: 0.05 };
    case "folder":
      return { roughness: 0.85, bumpScale: 0.8, lift: 0.02, curl: 0.0 };
    default:
      return { roughness: 0.86, bumpScale: 0.9, lift: 0.06, curl: 0.03 };
  }
};

export const REVEAL_STAMP = {
  offsetY: -0.08,
  lift: 0.06,
  widthRatio: 1.05,
  rotation: -0.18,
} as const;
