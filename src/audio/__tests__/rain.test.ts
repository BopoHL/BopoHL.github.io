import { describe, expect, it } from "vitest";
import { seededRandom } from "@/lib/random";
import { renderGlassDrop, renderRain } from "../rain";

const SAMPLE_RATE = 8000;

describe("rain loop", () => {
  const loop = renderRain(SAMPLE_RATE, seededRandom("test rain"), 3);

  it("lasts as long as asked and stays below clipping", () => {
    expect(loop).toHaveLength(SAMPLE_RATE * 3);
    const peak = loop.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
    expect(peak).toBeCloseTo(0.9, 5);
  });

  it("carries a steady bed of noise", () => {
    const rms = Math.sqrt(loop.reduce((sum, sample) => sum + sample * sample, 0) / loop.length);
    expect(rms).toBeGreaterThan(0.05);
    expect(rms).toBeLessThan(0.5);
  });

  it("loops without a click at the seam", () => {
    let largestStep = 0;
    for (let i = 1; i < loop.length; i++) largestStep = Math.max(largestStep, Math.abs(loop[i] - loop[i - 1]));
    expect(Math.abs(loop[0] - loop[loop.length - 1])).toBeLessThan(largestStep);
  });

  it("is reproducible", () => {
    expect(renderRain(SAMPLE_RATE, seededRandom("same"), 1)).toEqual(renderRain(SAMPLE_RATE, seededRandom("same"), 1));
  });
});

describe("a drop on the glass", () => {
  const drop = renderGlassDrop(SAMPLE_RATE * 6, seededRandom("one drop"));

  it("is a short tick that peaks at full scale and dies away", () => {
    const peak = drop.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
    expect(peak).toBeCloseTo(1, 5);
    expect(drop.length / (SAMPLE_RATE * 6)).toBeLessThan(0.15);
    const tail = drop.subarray(Math.floor(drop.length * 0.9));
    expect(tail.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0)).toBeLessThan(0.02);
  });

  it("is reproducible", () => {
    expect(renderGlassDrop(SAMPLE_RATE, seededRandom("same"))).toEqual(renderGlassDrop(SAMPLE_RATE, seededRandom("same")));
  });
});

