const TAU = Math.PI * 2;

export const WINDOW_DRIFT = {
  across: { amplitude: 2.6, period: 43 },
  down: { amplitude: 1.1, period: 61 },
} as const;

export const windowDrift = (time: number): [across: number, down: number] => [
  Math.sin((TAU * time) / WINDOW_DRIFT.across.period) * WINDOW_DRIFT.across.amplitude,
  Math.sin((TAU * time) / WINDOW_DRIFT.down.period + 1.3) * WINDOW_DRIFT.down.amplitude,
];
