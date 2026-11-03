import { MathUtils, Vector3 } from "three";
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
  startAngle?: number;
}

export interface PinPost {
  base: Vector3;
  axis: Vector3;
}

const X_AXIS = new Vector3(1, 0, 0);

export const winding = ({ base, axis }: PinPost, toward: Vector3, options: WindingOptions): Vector3[] => {
  const u = X_AXIS.clone().addScaledVector(axis, -axis.x).normalize();
  const v = new Vector3().crossVectors(axis, u);
  const direction = toward.clone().sub(base);
  const leave = Math.atan2(direction.dot(v), direction.dot(u)) - Math.PI / 2;
  const turnSweep = options.turns * Math.PI * 2;
  const sweep =
    options.startAngle === undefined ? turnSweep : turnSweep + MathUtils.euclideanModulo(leave - options.startAngle - turnSweep, Math.PI * 2);
  const turns = sweep / (Math.PI * 2);
  const count = Math.max(2, Math.round(turns * options.pointsPerTurn));
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count;
    const angle = leave - sweep * (1 - t);
    return base
      .clone()
      .addScaledVector(axis, options.pitch * turns * t)
      .addScaledVector(u, Math.cos(angle) * options.radius)
      .addScaledVector(v, Math.sin(angle) * options.radius);
  });
};

export interface TailOptions {
  length: number;
  sway: number;
  reach: number;
  lift: number;
  clearance: number;
  fall: number;
  samples: number;
}

export const hangingTail = (surface: Surface, from: Vector3, pin: Vec2, options: TailOptions): Vector3[] => {
  const out = new Vector3(from.x - pin[0], from.y - pin[1], 0).normalize();
  return Array.from({ length: options.samples + 1 }, (_, i) => {
    const t = i / options.samples;
    const spread = 1 - (1 - t) ** 2;
    const x = from.x + out.x * options.reach * spread + options.sway * t * t;
    const y = from.y + out.y * options.reach * spread - options.length * t ** 1.2;
    const resting = surface.heightAt([x, y]) + options.lift;
    const away = Math.hypot(x - pin[0], y - pin[1]) - options.clearance;
    const falling = MathUtils.smoothstep(away, 0, options.fall);
    return new Vector3(x, y, Math.max(resting, MathUtils.lerp(from.z, resting, falling)));
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
