import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { boardContentFor } from "@/content/selectors";
import { BoardSurface } from "../boardSurface";
import { createThreadGeometry, createThreadStrands } from "../threadGeometry";
import { THREAD_SIDES } from "../threadShader";

const coilThenRun = [
  ...Array.from({ length: 21 }, (_, i) => new Vector3(Math.cos(i * 0.6) * 0.03, Math.sin(i * 0.6) * 0.03, i * 0.0005)),
  new Vector3(2, 0.4, 0.01),
  new Vector3(4, 0.5, 0.01),
];

describe("thread geometry", () => {
  const geometry = createThreadGeometry(coilThenRun);
  const ring = THREAD_SIDES + 1;
  const along = Array.from({ length: geometry.attributes.uv.count / ring }, (_, i) => geometry.attributes.uv.getX(i * ring));

  it("spends two segments on every span between control points", () => {
    const segments = (coilThenRun.length - 1) * 2;
    expect(geometry.index?.count).toBe(segments * THREAD_SIDES * 6);
  });

  it("measures the twist by distance along the thread", () => {
    const polyline = coilThenRun.slice(1).reduce((sum, point, i) => sum + point.distanceTo(coilThenRun[i]), 0);
    expect(along[0]).toBe(0);
    expect(along.at(-1)).toBeGreaterThanOrEqual(polyline * 0.999);
    expect(along.at(-1)).toBeLessThan(polyline * 1.03);
    for (let i = 1; i < along.length; i++) expect(along[i]).toBeGreaterThan(along[i - 1]);
  });

  it("gives the tight coil as many twists per unit as the long run", () => {
    const coil = along[20 * 2];
    const coilLength = coilThenRun.slice(1, 21).reduce((sum, point, i) => sum + point.distanceTo(coilThenRun[i]), 0);
    expect(coil).toBeCloseTo(coilLength, 2);
  });
});

describe("thread strands", () => {
  const { evidence, threads } = boardContentFor("reveal");
  const { runs } = new BoardSurface(evidence, threads);
  const strands = createThreadStrands(runs);

  it("gathers every thread of one colour into a single strand", () => {
    expect([...strands.keys()].sort()).toEqual([...new Set(runs.map((run) => run.thread.area))].sort());
    for (const [area, strand] of strands) {
      const own = runs.filter((run) => run.thread.area === area);
      const triangles = own.reduce((sum, run) => sum + (createThreadGeometry(run.points).index?.count ?? 0), 0);
      expect(strand.index?.count).toBe(triangles);
    }
  });
});
