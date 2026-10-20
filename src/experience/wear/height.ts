import type { Corner, CornerCurl, Crease, Wave, Wear } from "./profile";

const CORNER_SIGNS: Record<Corner, [number, number]> = {
  topLeft: [-1, 1],
  topRight: [1, 1],
  bottomLeft: [-1, -1],
  bottomRight: [1, -1],
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export const creaseHeight = (crease: Crease, u: number, v: number) => {
  const along = crease.axis === "horizontal" ? v : u;
  const tent = Math.max(0, 1 - Math.abs(along - crease.position) / crease.spread);
  return crease.depth * (crease.ridge ? tent : 1 - tent);
};

export const curlHeight = (curl: CornerCurl, u: number, v: number) => {
  const [sx, sy] = CORNER_SIGNS[curl.corner];
  const t = clamp01((u * sx + v * sy - (1 - curl.size)) / curl.size);
  return curl.lift * t * t;
};

export const waveHeight = (wave: Wave, u: number, v: number) =>
  wave.amplitude *
  (0.5 + 0.5 * Math.sin(2 * Math.PI * (wave.frequencyX * u + wave.phaseX)) * Math.sin(2 * Math.PI * (wave.frequencyY * v + wave.phaseY)));

export const wearHeight = (wear: Wear, u: number, v: number) =>
  wear.creases.reduce((sum, crease) => sum + creaseHeight(crease, u, v), 0) +
  wear.curls.reduce((sum, curl) => sum + curlHeight(curl, u, v), 0) +
  waveHeight(wear.wave, u, v);
