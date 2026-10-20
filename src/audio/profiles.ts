export const TYPEWRITER_PROFILE_IDS = ["heavy", "crisp", "metal", "muffled"] as const;

export type TypewriterProfileId = (typeof TYPEWRITER_PROFILE_IDS)[number];

export interface NoiseLayer {
  frequency: number;
  q: number;
  gain: number;
  decay: number;
}

export interface ToneLayer {
  frequency: number;
  drop: number;
  gain: number;
  decay: number;
}

export interface Resonance {
  frequency: number;
  gain: number;
  decay: number;
}

export interface Stroke {
  press: NoiseLayer;
  clack?: NoiseLayer;
  thud: ToneLayer;
  body: NoiseLayer;
  ring: number;
}

export interface TypewriterProfile {
  level: number;
  tone: number;
  drive: number;
  reverb: number;
  room: number;
  strikeDelay: [number, number];
  key: Stroke;
  space: Stroke;
  partials: Resonance[];
  escapement: NoiseLayer & { delay: [number, number] };
}

export const TYPEWRITER_PROFILES: Record<TypewriterProfileId, TypewriterProfile> = {
  heavy: {
    level: 0.55,
    tone: 9000,
    drive: 1.6,
    reverb: 0.16,
    room: 0.45,
    strikeDelay: [0.014, 0.02],
    key: {
      press: { frequency: 1800, q: 1.2, gain: 0.25, decay: 0.012 },
      clack: { frequency: 3200, q: 0.8, gain: 0.9, decay: 0.022 },
      thud: { frequency: 165, drop: 0.55, gain: 0.7, decay: 0.07 },
      body: { frequency: 420, q: 2.5, gain: 0.5, decay: 0.06 },
      ring: 1,
    },
    space: {
      press: { frequency: 900, q: 0.8, gain: 0.5, decay: 0.03 },
      thud: { frequency: 110, drop: 0.6, gain: 0.8, decay: 0.09 },
      body: { frequency: 300, q: 2, gain: 0.5, decay: 0.07 },
      ring: 0.3,
    },
    partials: [
      { frequency: 1240, gain: 0.1, decay: 0.06 },
      { frequency: 2730, gain: 0.07, decay: 0.05 },
      { frequency: 4180, gain: 0.04, decay: 0.04 },
    ],
    escapement: { frequency: 5200, q: 3, gain: 0.18, decay: 0.01, delay: [0.028, 0.036] },
  },
  crisp: {
    level: 0.5,
    tone: 14000,
    drive: 1.2,
    reverb: 0.07,
    room: 0.25,
    strikeDelay: [0.01, 0.014],
    key: {
      press: { frequency: 2600, q: 1.5, gain: 0.3, decay: 0.008 },
      clack: { frequency: 4800, q: 1.1, gain: 1, decay: 0.014 },
      thud: { frequency: 230, drop: 0.6, gain: 0.35, decay: 0.035 },
      body: { frequency: 900, q: 3, gain: 0.3, decay: 0.03 },
      ring: 1,
    },
    space: {
      press: { frequency: 1400, q: 1, gain: 0.35, decay: 0.02 },
      thud: { frequency: 170, drop: 0.6, gain: 0.45, decay: 0.05 },
      body: { frequency: 600, q: 2.5, gain: 0.35, decay: 0.04 },
      ring: 0.3,
    },
    partials: [
      { frequency: 3100, gain: 0.06, decay: 0.03 },
      { frequency: 5600, gain: 0.04, decay: 0.02 },
    ],
    escapement: { frequency: 7000, q: 4, gain: 0.2, decay: 0.007, delay: [0.02, 0.026] },
  },
  metal: {
    level: 0.45,
    tone: 12000,
    drive: 1.8,
    reverb: 0.2,
    room: 0.6,
    strikeDelay: [0.012, 0.018],
    key: {
      press: { frequency: 2000, q: 1.2, gain: 0.2, decay: 0.01 },
      clack: { frequency: 3600, q: 0.9, gain: 0.85, decay: 0.02 },
      thud: { frequency: 190, drop: 0.6, gain: 0.45, decay: 0.05 },
      body: { frequency: 700, q: 4, gain: 0.3, decay: 0.05 },
      ring: 1,
    },
    space: {
      press: { frequency: 1100, q: 1, gain: 0.4, decay: 0.025 },
      thud: { frequency: 130, drop: 0.6, gain: 0.55, decay: 0.07 },
      body: { frequency: 500, q: 3, gain: 0.4, decay: 0.06 },
      ring: 0.5,
    },
    partials: [
      { frequency: 1870, gain: 0.12, decay: 0.14 },
      { frequency: 3150, gain: 0.09, decay: 0.12 },
      { frequency: 4710, gain: 0.06, decay: 0.09 },
      { frequency: 6230, gain: 0.04, decay: 0.07 },
    ],
    escapement: { frequency: 6000, q: 5, gain: 0.22, decay: 0.012, delay: [0.024, 0.03] },
  },
  muffled: {
    level: 0.7,
    tone: 2400,
    drive: 2.2,
    reverb: 0.3,
    room: 0.8,
    strikeDelay: [0.016, 0.022],
    key: {
      press: { frequency: 900, q: 1, gain: 0.3, decay: 0.018 },
      clack: { frequency: 1700, q: 0.9, gain: 0.8, decay: 0.03 },
      thud: { frequency: 120, drop: 0.5, gain: 0.9, decay: 0.1 },
      body: { frequency: 320, q: 2, gain: 0.6, decay: 0.08 },
      ring: 1,
    },
    space: {
      press: { frequency: 600, q: 0.8, gain: 0.45, decay: 0.035 },
      thud: { frequency: 90, drop: 0.55, gain: 1, decay: 0.12 },
      body: { frequency: 240, q: 1.8, gain: 0.6, decay: 0.1 },
      ring: 0.4,
    },
    partials: [{ frequency: 820, gain: 0.06, decay: 0.06 }],
    escapement: { frequency: 2600, q: 2, gain: 0.15, decay: 0.015, delay: [0.03, 0.04] },
  },
};
