import { describe, expect, it } from "vitest";
import { lampBrightness, lampSway } from "../lampLife";

const samples = Array.from({ length: 20000 }, (_, i) => i * 0.01);

describe("lamp life", () => {
  it("sways only slightly", () => {
    for (const time of samples) {
      const [x, y] = lampSway(time);
      expect(Math.abs(x)).toBeLessThan(0.02);
      expect(Math.abs(y)).toBeLessThan(0.01);
    }
  });

  it("stays bright apart from brief flickers", () => {
    const brightness = samples.map(lampBrightness);
    expect(Math.min(...brightness)).toBeGreaterThan(0.65);
    expect(Math.max(...brightness)).toBeLessThan(1.02);
    const dimmed = brightness.filter((value) => value < 0.95).length / brightness.length;
    expect(dimmed).toBeGreaterThan(0);
    expect(dimmed).toBeLessThan(0.02);
  });

  it("is deterministic", () => {
    expect(lampBrightness(42.42)).toBe(lampBrightness(42.42));
  });
});
