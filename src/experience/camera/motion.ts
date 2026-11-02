export type Easing = (t: number) => number;

export const smootherstep: Easing = (t) => t * t * t * (t * (t * 6 - 15) + 10);

export interface Pace {
  heightsPerSecond: number;
  maxShotsPerSecond: number;
}

export interface CameraMotion {
  hold: number;
  ease: Easing;
  easePeak: number;
  gazeLead: number;
  settle: number;
  parallax: number;
  progressSettle: number;
  dwell: number;
  browse: Pace;
  travel: Pace;
  haste: [number, number];
}

const ROUTE_FOLLOW = {
  ease: smootherstep,
  easePeak: 1.875,
  progressSettle: 0.35,
  dwell: 0.9,
  browse: { heightsPerSecond: 1.2, maxShotsPerSecond: 0.7 },
  travel: { heightsPerSecond: 6, maxShotsPerSecond: 3 },
  haste: [0.9, 2.2] as [number, number],
};

export const CLASSIC_MOTION: CameraMotion = {
  ...ROUTE_FOLLOW,
  hold: 0.18,
  gazeLead: 0,
  settle: 0.32,
  parallax: 0.18,
};

export const CINEMA_MOTION: CameraMotion = {
  ...ROUTE_FOLLOW,
  hold: 0.15,
  gazeLead: 0.08,
  settle: 0.3,
  parallax: 0.08,
};

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export interface MoveTiming {
  gaze: number;
  travel: number;
}

export const moveTiming = (raw: number, motion: CameraMotion): MoveTiming => {
  if (motion.gazeLead <= 0) {
    const eased = motion.ease(raw);
    return { gaze: eased, travel: eased };
  }
  return {
    gaze: motion.ease(clamp01(raw / (1 - motion.gazeLead))),
    travel: motion.ease(clamp01((raw - motion.gazeLead) / (1 - motion.gazeLead))),
  };
};
