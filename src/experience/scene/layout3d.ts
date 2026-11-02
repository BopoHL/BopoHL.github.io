import { pinOf, pinOffsetOf } from "@/content/geometry";
import type { Area, Evidence } from "@/content/types";

export const CARD_BASE_Z = 0.03;
export const CARD_LAYER_STEP = 0.008;

export const cardZ = (index: number) => CARD_BASE_Z + index * CARD_LAYER_STEP;

export const PIN_THREAD_HEIGHT = 0.007;

export const pinWorld = (item: Evidence, index: number): [number, number, number] => {
  const [x, y] = pinOf(item);
  return [x, y, cardZ(index) + PIN_THREAD_HEIGHT];
};

export const pinLocal = (item: Evidence): [number, number, number] => [...pinOffsetOf(item), 0];

export const PIN_COLORS: Record<Area, string> = {
  case: "#b08d57",
  work: "#b3242a",
  study: "#2c5aa8",
  hobby: "#417d3e",
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
