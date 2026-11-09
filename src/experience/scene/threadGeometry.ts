import { CatmullRomCurve3, TubeGeometry, Vector3 } from "three";
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
