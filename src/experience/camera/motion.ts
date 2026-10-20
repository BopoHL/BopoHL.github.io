export type Easing = (t: number) => number;

export const smootherstep: Easing = (t) => t * t * t * (t * (t * 6 - 15) + 10);

export const easeInOutQuint: Easing = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);

export interface CameraMotion {
  hold: number;
  ease: Easing;
  gazeLead: number;
  pullback: number;
  minPullback: number;
  maxPullback: number;
  swing: number;
  bank: number;
  follow: number;
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
  follow: 4.5,
  parallax: 0.18,
};

export const CINEMA_MOTION: CameraMotion = {
  hold: 0.42,
  ease: easeInOutQuint,
  gazeLead: 0.3,
  pullback: 0.6,
  minPullback: 2.5,
  maxPullback: 10,
  swing: 0.35,
  bank: 0.12,
  follow: 7.5,
  parallax: 0.1,
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
