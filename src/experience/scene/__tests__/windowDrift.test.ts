import { describe, expect, it } from "vitest";
import { WINDOW_DRIFT, windowDrift } from "../windowDrift";

describe("window light drift", () => {
  const step = 0.1;
  const samples = Array.from({ length: 6000 }, (_, i) => windowDrift(i * step));

  it("stays within a few units of its resting place", () => {
    for (const [across, down] of samples) {
      expect(Math.abs(across)).toBeLessThanOrEqual(WINDOW_DRIFT.across.amplitude);
      expect(Math.abs(down)).toBeLessThanOrEqual(WINDOW_DRIFT.down.amplitude);
    }
  });

  it("creeps slowly enough to read the board underneath", () => {
    for (let i = 1; i < samples.length; i++) {
      const speed = Math.hypot(samples[i][0] - samples[i - 1][0], samples[i][1] - samples[i - 1][1]) / step;
      expect(speed).toBeLessThan(0.5);
    }
  });

  it("does move", () => {
    const spread = Math.max(...samples.map(([across]) => across)) - Math.min(...samples.map(([across]) => across));
    expect(spread).toBeGreaterThan(WINDOW_DRIFT.across.amplitude);
  });
});
