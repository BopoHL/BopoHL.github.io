import { describe, expect, it } from "vitest";
import { counterReading, REEL, reelState } from "../reels";

const SECONDS = 78;

describe("reelState", () => {
  it("moves the whole tape pack from the supply reel to the take-up reel", () => {
    const start = reelState(0, SECONDS);
    const end = reelState(1, SECONDS);
    expect(start.supplyRadius).toBeCloseTo(REEL.full);
    expect(start.takeUpRadius).toBeCloseTo(REEL.hub);
    expect(end.supplyRadius).toBeCloseTo(REEL.hub);
    expect(end.takeUpRadius).toBeCloseTo(REEL.full);
  });

  it("keeps the amount of tape constant while it winds", () => {
    const area = (p: number) => {
      const { supplyRadius, takeUpRadius } = reelState(p, SECONDS);
      return supplyRadius ** 2 + takeUpRadius ** 2;
    };
    for (const p of [0.1, 0.35, 0.8]) expect(area(p)).toBeCloseTo(area(0));
  });

  it("spins the nearly empty reel faster, like a real cassette", () => {
    const step = 0.001;
    const early = reelState(step, SECONDS);
    expect(early.takeUpAngle / early.supplyAngle).toBeCloseTo(REEL.full / REEL.hub, 1);
  });

  it("winds the same angle back on rewind and resets the counter", () => {
    const there = reelState(0.6, SECONDS);
    const back = reelState(0, SECONDS);
    expect(counterReading(there.takeUpAngle)).toBeGreaterThan(0);
    expect(back.takeUpAngle).toBe(0);
    expect(counterReading(back.takeUpAngle)).toBe(0);
  });
});
