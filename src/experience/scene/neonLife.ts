import { hashNumber01 } from "@/lib/random";

const STUTTER_PERIOD = 13;
const STUTTER_CHANCE = 0.6;
const GAPS: ReadonlyArray<[number, number]> = [
  [0, 0.07],
  [0.21, 0.05],
  [0.5, 0.11],
];
const DARK = 0.18;
const BUZZ = 0.025;

const isDark = (time: number) => {
  const cycle = Math.floor(time / STUTTER_PERIOD);
  if (hashNumber01(cycle + 0.37) > STUTTER_CHANCE) return false;
  const start = cycle * STUTTER_PERIOD + hashNumber01(cycle + 0.71) * (STUTTER_PERIOD - 1);
  const gaps = 2 + Math.floor(hashNumber01(cycle + 0.13) * 2);
  const local = time - start;
  return GAPS.slice(0, gaps).some(([at, length]) => local >= at && local < at + length);
};

export const neonLevel = (time: number) =>
  isDark(time) ? DARK : 1 - BUZZ * (0.5 + 0.5 * Math.sin(time * 31.4) * Math.sin(time * 4.7));
