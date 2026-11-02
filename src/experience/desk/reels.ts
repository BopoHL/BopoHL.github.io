export const REEL = { hub: 0.16, full: 0.37, surfaceSpeed: 0.7 };

const WOUND = REEL.full ** 2 - REEL.hub ** 2;

export interface ReelState {
  supplyRadius: number;
  takeUpRadius: number;
  supplyAngle: number;
  takeUpAngle: number;
}

export const reelState = (progress: number, seconds: number): ReelState => {
  const p = Math.min(1, Math.max(0, progress));
  const supplyRadius = Math.sqrt(REEL.hub ** 2 + (1 - p) * WOUND);
  const takeUpRadius = Math.sqrt(REEL.hub ** 2 + p * WOUND);
  const turnsScale = (2 * seconds * REEL.surfaceSpeed) / WOUND;
  return {
    supplyRadius,
    takeUpRadius,
    supplyAngle: turnsScale * (REEL.full - supplyRadius),
    takeUpAngle: turnsScale * (takeUpRadius - REEL.hub),
  };
};

const COUNTER_PER_TURN = 3;

export const counterReading = (takeUpAngle: number) =>
  Math.floor((takeUpAngle / (Math.PI * 2)) * COUNTER_PER_TURN) % 1000;
