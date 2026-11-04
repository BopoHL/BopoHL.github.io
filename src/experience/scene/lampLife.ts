import { hashNumber01 } from "@/lib/random";

const TAU = Math.PI * 2;
const FLICKER_PERIOD = 9;
const FLICKER_CHANCE = 0.55;
const FLICKER_PULSES = [0, 0.11, 0.27];
const FLICKER_WIDTH = 0.035;
const FLICKER_DEPTH: [number, number] = [0.12, 0.28];
const SWAY = { x: [0.011, 7.3], y: [0.006, 9.7] } as const;
const HUM = 0.012;

export const lampSway = (time: number): [number, number] => [
  Math.sin((TAU * time) / SWAY.x[1]) * SWAY.x[0] + Math.sin((TAU * time) / 3.1 + 1.3) * SWAY.x[0] * 0.25,
  Math.sin((TAU * time) / SWAY.y[1] + 0.6) * SWAY.y[0],
];

const flickerDip = (time: number) => {
  const cycle = Math.floor(time / FLICKER_PERIOD);
  if (hashNumber01(cycle) > FLICKER_CHANCE) return 0;
  const start = cycle * FLICKER_PERIOD + hashNumber01(cycle + 0.5) * (FLICKER_PERIOD - 1);
  const depth = FLICKER_DEPTH[0] + hashNumber01(cycle + 0.25) * (FLICKER_DEPTH[1] - FLICKER_DEPTH[0]);
  const local = time - start;
  return FLICKER_PULSES.reduce(
    (dip, at, index) => Math.max(dip, depth * (1 - index * 0.25) * Math.exp(-(((local - at) / FLICKER_WIDTH) ** 2))),
    0,
  );
};

export const lampBrightness = (time: number) =>
  1 + HUM * Math.sin(time * 7.1) * Math.sin(time * 2.3) - flickerDip(time);
