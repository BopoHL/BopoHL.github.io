import type { NoiseLayer, ToneLayer } from "./profiles";
import { audioRig, type AudioRig } from "./rig";
import { noiseHit, toneHit } from "./voices";

const RUSTLE_GRAINS: [number, number] = [7, 12];
const RUSTLE_SPAN = 0.32;
const RUSTLE_COOLDOWN = 0.14;
const RUSTLE_LEVEL = 0.55;
const CLICK_LEVEL = 0.7;

const RUSTLE_BODY: NoiseLayer = { frequency: 950, q: 0.6, gain: 0.05, decay: 0.2 };
const CLICK_TICK: NoiseLayer = { frequency: 4300, q: 4, gain: 0.28, decay: 0.006 };
const CLICK_SNAP: ToneLayer = { frequency: 2600, drop: 0.7, gain: 0.07, decay: 0.03 };
const CLICK_THUMP: ToneLayer = { frequency: 180, drop: 0.6, gain: 0.14, decay: 0.026 };

let rustledAt = Number.NEGATIVE_INFINITY;

const between = (min: number, max: number) => min + Math.random() * (max - min);

const panned = ({ context, output }: AudioRig, level: number) => {
  const gain = context.createGain();
  gain.gain.value = level;
  const pan = context.createStereoPanner();
  pan.pan.value = between(-0.35, 0.35);
  gain.connect(pan).connect(output);
  return gain;
};

export const playPaperRustle = () => {
  const rig = audioRig();
  if (!rig) return;
  const now = rig.context.currentTime;
  if (now - rustledAt < RUSTLE_COOLDOWN) return;
  rustledAt = now;
  const bus = panned(rig, RUSTLE_LEVEL);
  noiseHit(rig, bus, now + 0.005, RUSTLE_BODY, between(0.85, 1.15), 1);
  const grains = Math.round(between(...RUSTLE_GRAINS));
  for (let i = 0; i < grains; i++) {
    const at = now + 0.005 + RUSTLE_SPAN * Math.random() ** 1.6;
    const grain: NoiseLayer = {
      frequency: between(2200, 6800),
      q: between(0.8, 1.8),
      gain: between(0.04, 0.13),
      decay: between(0.008, 0.032),
    };
    noiseHit(rig, bus, at, grain, 1, 1);
  }
};

export const playPinClick = () => {
  const rig = audioRig();
  if (!rig) return;
  const at = rig.context.currentTime + 0.005;
  const bus = panned(rig, CLICK_LEVEL);
  const pitch = between(0.92, 1.08);
  noiseHit(rig, bus, at, CLICK_TICK, pitch, 1);
  toneHit(rig.context, bus, at, CLICK_SNAP, pitch, 1);
  toneHit(rig.context, bus, at + 0.002, CLICK_THUMP, pitch, 1);
};

const SWITCH_TICK: NoiseLayer = { frequency: 3200, q: 3, gain: 0.35, decay: 0.008 };
const SWITCH_BODY: ToneLayer = { frequency: 420, drop: 0.5, gain: 0.12, decay: 0.035 };
const KEY_CLUNK: NoiseLayer = { frequency: 1400, q: 1.2, gain: 0.45, decay: 0.03 };
const KEY_THUMP: ToneLayer = { frequency: 140, drop: 0.55, gain: 0.3, decay: 0.06 };
const KEY_LATCH: NoiseLayer = { frequency: 5200, q: 4, gain: 0.18, decay: 0.006 };

export const playSwitchClick = () => {
  const rig = audioRig();
  if (!rig) return;
  const at = rig.context.currentTime + 0.005;
  const bus = panned(rig, CLICK_LEVEL);
  noiseHit(rig, bus, at, SWITCH_TICK, between(0.9, 1.1), 1);
  toneHit(rig.context, bus, at, SWITCH_BODY, between(0.95, 1.05), 1);
};

export const playKeyClunk = (latched: boolean) => {
  const rig = audioRig();
  if (!rig) return;
  const at = rig.context.currentTime + 0.005;
  const bus = panned(rig, CLICK_LEVEL);
  const pitch = between(0.94, 1.06);
  noiseHit(rig, bus, at, KEY_CLUNK, pitch, 1);
  toneHit(rig.context, bus, at, KEY_THUMP, pitch, 1);
  if (latched) noiseHit(rig, bus, at + 0.035, KEY_LATCH, pitch, 1);
};
