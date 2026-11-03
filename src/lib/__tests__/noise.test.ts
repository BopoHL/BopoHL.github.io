import { describe, expect, it } from "vitest";
import { fbm, valueNoise } from "../noise";

describe("noise", () => {
  it("is deterministic and stays within 0..1", () => {
    for (let i = 0; i < 200; i++) {
      const value = fbm(i * 0.37, i * 0.11, i * 0.73, 4, 7);
      expect(value).toBe(fbm(i * 0.37, i * 0.11, i * 0.73, 4, 7));
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("varies smoothly between lattice points", () => {
    const a = valueNoise(1.5, 2.5, 3.5);
    const b = valueNoise(1.501, 2.5, 3.5);
    expect(Math.abs(a - b)).toBeLessThan(0.01);
  });

  it("changes with the seed", () => {
    expect(valueNoise(0.5, 0.5, 0.5, 1)).not.toBe(valueNoise(0.5, 0.5, 0.5, 2));
  });
});
