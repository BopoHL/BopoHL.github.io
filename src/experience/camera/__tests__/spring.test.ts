import { describe, expect, it } from "vitest";
import { ScalarSpring, smoothDamp } from "../spring";

const settle = (target: number, smoothTime: number, seconds: number, fps = 60) => {
  const spring = new ScalarSpring(0);
  const velocities: number[] = [];
  for (let frame = 0; frame < seconds * fps; frame++) {
    spring.update(target, smoothTime, 1 / fps);
    velocities.push(spring.velocity);
  }
  return { spring, velocities };
};

describe("smoothDamp", () => {
  it("reaches the target without overshooting", () => {
    const { spring } = settle(10, 0.4, 3);
    expect(spring.value).toBeCloseTo(10, 2);
    expect(spring.value).toBeLessThanOrEqual(10);
  });

  it("starts moving gradually instead of jumping", () => {
    const { velocities } = settle(10, 0.4, 0.5);
    expect(Math.abs(velocities[0])).toBeLessThan(Math.abs(velocities[5]));
  });

  it("produces the same path regardless of frame rate", () => {
    const fast = settle(5, 0.3, 1, 120).spring.value;
    const slow = settle(5, 0.3, 1, 30).spring.value;
    expect(fast).toBeCloseTo(slow, 1);
  });

  it("never travels faster than the speed limit", () => {
    const spring = new ScalarSpring(0);
    let fastest = 0;
    for (let frame = 0; frame < 600; frame++) {
      spring.update(30, 0.35, 1 / 60, 4);
      fastest = Math.max(fastest, Math.abs(spring.velocity));
    }
    expect(fastest).toBeLessThanOrEqual(4.01);
    expect(spring.value).toBeCloseTo(30, 1);
  });

  it("ignores empty frames", () => {
    expect(smoothDamp(1, 5, 2, 0.3, 0)).toEqual({ value: 1, velocity: 2 });
  });
});
