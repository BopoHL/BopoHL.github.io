import { describe, expect, it } from "vitest";
import { ResolutionGovernor, pixelRatioRange } from "../resolutionGovernor";

const feed = (governor: ResolutionGovernor, intervalMs: number, frames: number) => {
  const changes: number[] = [];
  for (let i = 0; i < frames; i++) {
    const next = governor.frame(intervalMs);
    if (next !== null) changes.push(next);
  }
  return changes;
};

describe("ResolutionGovernor", () => {
  it("keeps full resolution while frames arrive on time", () => {
    const governor = new ResolutionGovernor({ min: 1, max: 1.5 });
    expect(feed(governor, 1000 / 60, 600)).toEqual([]);
    expect(governor.pixelRatio).toBe(1.5);
  });

  it("steps the resolution down while the device keeps missing frames, but not below the floor", () => {
    const governor = new ResolutionGovernor({ min: 1, max: 1.5 });
    expect(feed(governor, 1000 / 30, 400)).toEqual([1.25, 1]);
    expect(governor.pixelRatio).toBe(1);
  });

  it("steps back up only after a sustained calm stretch", () => {
    const governor = new ResolutionGovernor({ min: 1, max: 1.5 }, 1);
    expect(feed(governor, 1000 / 60, 120)).toEqual([]);
    expect(feed(governor, 1000 / 60, 40)).toEqual([1.25]);
  });

  it("does not climb back while frames are merely acceptable", () => {
    const governor = new ResolutionGovernor({ min: 1, max: 1.5 }, 1);
    expect(feed(governor, 1000 / 50, 2000)).toEqual([]);
  });

  it("never asks for more pixels than the screen has", () => {
    expect(pixelRatioRange([1, 1.5], 1)).toEqual({ min: 1, max: 1 });
    expect(pixelRatioRange([1, 1.5], 3)).toEqual({ min: 1, max: 1.5 });
    expect(pixelRatioRange([1, 1.5], 1.25)).toEqual({ min: 1, max: 1.25 });
  });
});
