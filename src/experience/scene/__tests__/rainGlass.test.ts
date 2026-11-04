import { describe, expect, it } from "vitest";
import { seededRandom } from "@/lib/random";
import { RAIN, RainGlass, type RainSettings } from "../rainGlass";

const PANE: RainSettings = { beads: 300, runners: 14, scale: 1 };

const run = (glass: RainGlass, seconds: number, fps = 12) => {
  for (let i = 0; i < seconds * fps; i++) glass.step(1 / fps);
};

describe("rain on the window glass", () => {
  it("keeps every drop on the pane", () => {
    const glass = new RainGlass(seededRandom("pane"), PANE);
    run(glass, 120);
    expect(glass.beads).toHaveLength(PANE.beads);
    expect(glass.runners).toHaveLength(PANE.runners);
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
    const glass = new RainGlass(seededRandom("slide"), PANE);
    const tops = glass.runners.map((runner) => runner.top);
    run(glass, 60);
    const restarted = glass.runners.filter((runner, index) => runner.top !== tops[index]);
    expect(restarted.length).toBeGreaterThan(0);
    expect(glass.runners.some((runner) => runner.y > runner.top)).toBe(true);
  });

  it("shrinks every drop when the glass covers a wider stretch of wall", () => {
    const glass = new RainGlass(seededRandom("wide"), { beads: 900, runners: 40, scale: 0.4 });
    run(glass, 60);
    for (const drop of [...glass.beads, ...glass.runners]) expect(drop.radius).toBeLessThanOrEqual(RAIN.maxRunner * 0.4);
  });

  it("is reproducible for the same seed", () => {
    const a = new RainGlass(seededRandom("same"), PANE);
    const b = new RainGlass(seededRandom("same"), PANE);
    run(a, 10);
    run(b, 10);
    expect(a.runners).toEqual(b.runners);
    expect(a.beads).toEqual(b.beads);
  });
});
