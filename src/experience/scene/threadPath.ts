import { Vector3 } from "three";
import type { Vec2 } from "@/content/types";

export interface Surface {
  heightAt(point: Vec2): number;
}

interface ThreadPathOptions {
  radius: number;
  clearance: number;
  sagPerUnit: number;
  maxSag: number;
  samplesPerUnit: number;
}

interface Sample {
  distance: number;
  height: number;
}

const cross = (o: Sample, a: Sample, b: Sample) =>
  (a.distance - o.distance) * (b.height - o.height) - (a.height - o.height) * (b.distance - o.distance);

const upperHull = (samples: Sample[]) => {
  const hull: Sample[] = [];
  for (const sample of samples) {
    while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], sample) >= 0) hull.pop();
    hull.push(sample);
  }
  return hull;
};

const heightOnHull = (hull: Sample[], distance: number) => {
  for (let i = 1; i < hull.length; i++) {
    const a = hull[i - 1];
    const b = hull[i];
    if (distance <= b.distance) {
      const span = b.distance - a.distance;
      return span > 0 ? a.height + ((distance - a.distance) / span) * (b.height - a.height) : b.height;
    }
  }
  return hull[hull.length - 1].height;
};

export interface WindingOptions {
  radius: number;
  turns: number;
  pitch: number;
  pointsPerTurn: number;
}

export const winding = (center: Vector3, toward: Vector3, options: WindingOptions): Vector3[] => {
  const leave = Math.atan2(toward.y - center.y, toward.x - center.x) - Math.PI / 2;
  const count = Math.max(2, Math.round(options.turns * options.pointsPerTurn));
  const sweep = options.turns * Math.PI * 2;
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count;
    const angle = leave - sweep * (1 - t);
    return new Vector3(
      center.x + Math.cos(angle) * options.radius,
      center.y + Math.sin(angle) * options.radius,
      center.z + options.pitch * options.turns * t,
    );
  });
};

export const threadPath = (surface: Surface, from: Vector3, to: Vector3, options: ThreadPathOptions): Vector3[] => {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const sag = Math.min(options.maxSag, length * options.sagPerUnit);
  const count = Math.max(8, Math.ceil(length * options.samplesPerUnit));
  const lift = options.radius + options.clearance;
  const points: Vector3[] = [];
  const samples: Sample[] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t - sag * 4 * t * (1 - t);
    points.push(new Vector3(x, y, 0));
    const resting = surface.heightAt([x, y]) + lift;
    const height = i === 0 ? from.z : i === count ? to.z : resting;
    samples.push({ distance: t * length, height });
  }
  const hull = upperHull(samples);
  return points.map((point, i) => point.setZ(heightOnHull(hull, samples[i].distance)));
};
