import { describe, expect, it } from "vitest";
import { seededRandom } from "@/lib/random";
import { RAIN, RainGlass } from "../rainGlass";

const run = (glass: RainGlass, seconds: number, fps = 12) => {
  for (let i = 0; i < seconds * fps; i++) glass.step(1 / fps);
};

describe("rain on the window glass", () => {
  it("keeps every drop on the pane", () => {
    const glass = new RainGlass(seededRandom("pane"));
    run(glass, 120);
    expect(glass.beads).toHaveLength(RAIN.beads);
    expect(glass.runners).toHaveLength(RAIN.runners);
    for (const bead of glass.beads) {
      expect(bead.x).toBeGreaterThanOrEqual(0);
      expect(bead.x).toBeLessThanOrEqual(1);
      expect(bead.y).toBeGreaterThanOrEqual(0);
      expect(bead.y).toBeLessThanOrEqual(1);
    }
    for (const runner of glass.runners) {
      expect(runner.radius).toBeLessThanOrEqual(RAIN.maxRunner);
      expect(runner.y).toBeGreaterThanOrEqual(runner.top);
      expect(runner.y - runner.radius).toBeLessThanOrEqual(1);
    }
  });

  it("lets runners slide down and start over at the top", () => {
    const glass = new RainGlass(seededRandom("slide"));
    const tops = glass.runners.map((runner) => runner.top);
    run(glass, 60);
    const restarted = glass.runners.filter((runner, index) => runner.top !== tops[index]);
    expect(restarted.length).toBeGreaterThan(0);
    expect(glass.runners.some((runner) => runner.y > runner.top)).toBe(true);
  });

  it("is reproducible for the same seed", () => {
    const a = new RainGlass(seededRandom("same"));
    const b = new RainGlass(seededRandom("same"));
    run(a, 10);
    run(b, 10);
    expect(a.runners).toEqual(b.runners);
    expect(a.beads).toEqual(b.beads);
  });
});
