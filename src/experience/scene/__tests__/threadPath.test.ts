import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import type { Vec2 } from "@/content/types";
import { hangingTail, threadPath, winding } from "../threadPath";

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

describe("winding", () => {
  const center = new Vector3(1, 2, 0.05);
  const toward = new Vector3(4, 2, 0.05);
  const options = { radius: 0.011, turns: 2, pitch: 0.004, pointsPerTurn: 16 };
  const coil = winding({ base: center, axis: new Vector3(0, 0, 1) }, toward, options);

  it("wraps around the pin", () => {
    for (const point of coil) expect(Math.hypot(point.x - center.x, point.y - center.y)).toBeCloseTo(options.radius);
  });

  it("climbs the pin as it turns", () => {
    expect(coil.at(-1)!.z - coil[0].z).toBeCloseTo(options.turns * options.pitch);
  });

  it("follows a tilted pin", () => {
    const axis = new Vector3(0.1, 0, 1).normalize();
    const tilted = winding({ base: center, axis }, toward, options);
    for (const point of tilted) {
      const along = point.clone().sub(center).dot(axis);
      const fromAxis = point.clone().sub(center).addScaledVector(axis, -along).length();
      expect(fromAxis).toBeCloseTo(options.radius);
    }
  });

  it("can start the coil at a chosen side of the pin", () => {
    const startAngle = -Math.PI / 2;
    const first = winding({ base: center, axis: new Vector3(0, 0, 1) }, toward, { ...options, startAngle })[0];
    expect(first.x - center.x).toBeCloseTo(0);
    expect(first.y - center.y).toBeCloseTo(-options.radius);
  });

  it("leaves the pin heading for the other end", () => {
    const last = coil.at(-1)!;
    const before = coil.at(-2)!;
    const heading = Math.atan2(last.y - before.y, last.x - before.x);
    expect(Math.abs(heading)).toBeLessThan(0.25);
  });
});

describe("hangingTail", () => {
  const pin: Vec2 = [0, 0];
  const options = { length: 0.12, sway: 0.02, reach: 0.06, lift: 0.006, clearance: 0.09, fall: 0.05, samples: 12 };
  const tail = hangingTail(flat, new Vector3(0.01, -0.035, 0.07), pin, options);

  it("hangs down the board under gravity", () => {
    expect(tail.at(-1)!.y).toBeLessThan(-0.05);
  });

  it("keeps clear of the pin head until it is past it", () => {
    for (const point of tail) {
      if (Math.hypot(point.x, point.y) < options.clearance) expect(point.z).toBeCloseTo(0.07);
    }
  });

  it("ends lying on the paper", () => {
    expect(tail.at(-1)!.z).toBeCloseTo(options.lift);
  });
});
