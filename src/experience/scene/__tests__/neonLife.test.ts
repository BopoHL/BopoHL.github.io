import { describe, expect, it } from "vitest";
import { neonLevel } from "../neonLife";

const STEP = 0.005;
const samples = Array.from({ length: 120 / STEP }, (_, i) => i * STEP);

describe("neon sign outside", () => {
  const levels = samples.map(neonLevel);

  it("stays lit apart from short stutters", () => {
    expect(Math.min(...levels)).toBeGreaterThan(0.1);
    expect(Math.max(...levels)).toBeLessThanOrEqual(1);
    const dark = levels.filter((level) => level < 0.5).length / levels.length;
    expect(dark).toBeGreaterThan(0);
    expect(dark).toBeLessThan(0.01);
  });

  it("never blinks more than three times a second", () => {
    const dips = levels.flatMap((level, i) => (i > 0 && level < 0.5 && levels[i - 1] >= 0.5 ? [samples[i]] : []));
    for (const at of dips) expect(dips.filter((other) => other >= at && other < at + 1).length).toBeLessThanOrEqual(3);
  });

  it("is deterministic", () => {
    expect(neonLevel(77.7)).toBe(neonLevel(77.7));
  });
});
