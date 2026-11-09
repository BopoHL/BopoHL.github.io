import { CatmullRomCurve3, TubeGeometry, Vector3, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Thread } from "@/content/types";
import type { ThreadRun } from "./boardSurface";
import { THREAD_RADIUS } from "./threadShader";

export const THREAD_RADIAL_SEGMENTS = 4;
const SEGMENTS_PER_SPAN = 2;

class SpanCurve extends CatmullRomCurve3 {
  override getPointAt(u: number, target?: Vector3) {
    return this.getPoint(u, target);
  }

  override getTangentAt(u: number, target?: Vector3) {
    return this.getTangent(u, target);
  }
}

export const createThreadGeometry = (points: Vector3[]) => {
  const curve = new SpanCurve(points, false, "centripetal");
  const segments = (points.length - 1) * SEGMENTS_PER_SPAN;
  const geometry = new TubeGeometry(curve, segments, THREAD_RADIUS, THREAD_RADIAL_SEGMENTS, false);
  const uv = geometry.attributes.uv;
  const ring = THREAD_RADIAL_SEGMENTS + 1;
  let along = 0;
  let previous = curve.getPoint(0);
  for (let i = 0; i <= segments; i++) {
    const center = curve.getPoint(i / segments);
    along += center.distanceTo(previous);
    previous = center;
    for (let j = 0; j < ring; j++) uv.setX(i * ring + j, along);
  }
  return geometry;
};

export const createThreadStrands = (runs: ThreadRun[]) => {
  const byArea = new Map<Thread["area"], BufferGeometry[]>();
  for (const { thread, points } of runs) byArea.set(thread.area, [...(byArea.get(thread.area) ?? []), createThreadGeometry(points)]);
  return new Map(
    [...byArea].map(([area, parts]) => {
      const strand = mergeGeometries(parts);
      for (const part of parts) part.dispose();
      return [area, strand] as const;
    }),
  );
};
