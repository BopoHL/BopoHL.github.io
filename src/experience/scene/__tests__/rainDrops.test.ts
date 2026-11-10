import { describe, expect, it } from "vitest";
import { seededRandom } from "@/lib/random";
import { DROP_FLOATS, RUNNER_STRETCH, dropCount, writeDrops } from "../rainDrops";
import { RainGlass } from "../rainGlass";

describe("drops handed to the window shader", () => {
  const glass = new RainGlass(seededRandom("pane"), { beads: 40, runners: 5, scale: 1 });
  for (let i = 0; i < 60; i++) glass.step(1 / 12);
  const drops = new Float32Array(dropCount(glass) * DROP_FLOATS);
  const trails = new Float32Array(glass.runners.length * DROP_FLOATS);
  writeDrops(glass, drops, trails);
  const drop = (index: number) => [...drops.subarray(index * DROP_FLOATS, (index + 1) * DROP_FLOATS)];

  it("draws every bead round and every runner stretched along its fall", () => {
    expect(dropCount(glass)).toBe(45);
    glass.beads.forEach((bead, index) => {
      expect(drop(index)).toEqual([bead.x, bead.y, bead.radius, 1].map(Math.fround));
    });
    glass.runners.forEach((runner, index) => {
      expect(drop(glass.beads.length + index)).toEqual([runner.x, runner.y, runner.radius, RUNNER_STRETCH].map(Math.fround));
    });
  });

  it("gives each runner a trail from where it started to where it is", () => {
    glass.runners.forEach((runner, index) => {
      const [x, top, y, radius] = trails.subarray(index * DROP_FLOATS, (index + 1) * DROP_FLOATS);
      expect([x, top, y, radius]).toEqual([runner.x, runner.top, runner.y, runner.radius].map(Math.fround));
      expect(y).toBeGreaterThanOrEqual(top);
    });
  });
});
