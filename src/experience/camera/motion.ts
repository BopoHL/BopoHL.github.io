export type Easing = (t: number) => number;

export const smootherstep: Easing = (t) => t * t * t * (t * (t * 6 - 15) + 10);

export interface CameraMotion {
  hold: number;
  ease: Easing;
  gazeLead: number;
  pullback: number;
  minPullback: number;
  maxPullback: number;
  swing: number;
  bank: number;
  settle: number;
  parallax: number;
  progressSettle: number;
  maxShotsPerSecond: number;
  haste: [number, number];
  travelLift: number;
}

const ROUTE_FOLLOW = {
  progressSettle: 0.35,
  maxShotsPerSecond: 3.5,
  haste: [0.7, 2.2] as [number, number],
};

export const CLASSIC_MOTION: CameraMotion = {
  hold: 0.32,
  ease: smootherstep,
  gazeLead: 0,
  pullback: 0.28,
  minPullback: 0,
  maxPullback: 6,
  swing: 0,
  bank: 0,
  settle: 0.32,
  parallax: 0.18,
  ...ROUTE_FOLLOW,
  travelLift: 4,
};

export const CINEMA_MOTION: CameraMotion = {
  hold: 0.28,
  ease: smootherstep,
  gazeLead: 0.12,
  pullback: 0.4,
  minPullback: 1.2,
  maxPullback: 6,
  swing: 0.15,
  bank: 0.04,
  settle: 0.3,
  parallax: 0.08,
  ...ROUTE_FOLLOW,
  travelLift: 3,
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
