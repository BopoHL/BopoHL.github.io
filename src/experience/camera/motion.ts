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
}

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
  settle: 0.45,
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
