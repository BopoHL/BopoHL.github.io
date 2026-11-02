import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import type { Vec2 } from "@/content/types";
import { threadPath } from "../threadPath";

const options = { radius: 0.005, clearance: 0.002, sagPerUnit: 0, maxSag: 0, samplesPerUnit: 20 };
const flat = { heightAt: () => 0 };
const ridge = { heightAt: ([x]: Vec2) => (x > 2 && x < 3 ? 0.3 : 0) };

describe("threadPath", () => {
  it("runs straight between pins over an empty board", () => {
    const points = threadPath(flat, new Vector3(0, 0, 0.1), new Vector3(4, 0, 0.1), options);
    for (const point of points) expect(point.z).toBeCloseTo(0.1);
  });

  it("starts and ends at the pins", () => {
    const from = new Vector3(0, 0, 0.1);
    const to = new Vector3(4, 1, 0.05);
    const points = threadPath(ridge, from, to, options);
    expect(points[0].distanceTo(from)).toBeCloseTo(0);
    expect(points.at(-1)?.distanceTo(to)).toBeCloseTo(0);
  });

  it("rests on top of paper it crosses instead of passing under it", () => {
    const points = threadPath(ridge, new Vector3(0, 0, 0.1), new Vector3(5, 0, 0.1), options);
    for (const point of points) {
      expect(point.z).toBeGreaterThanOrEqual(ridge.heightAt([point.x, point.y]) + options.radius);
    }
  });

  it("stays taut: straight segments from the pins up to the paper edge", () => {
    const points = threadPath(ridge, new Vector3(0, 0, 0.1), new Vector3(5, 0, 0.1), options);
    const rising = points.filter((point) => point.x > 0.5 && point.x < 2);
    const slopes = rising.slice(1).map((point, i) => (point.z - rising[i].z) / (point.x - rising[i].x));
    for (const slope of slopes) expect(slope).toBeCloseTo(slopes[0], 5);
  });
});
