import { BOARD_SIZE } from "@/content/board";
import { boundsOf, centerOf, extentOf, unionBounds, type Bounds } from "@/content/geometry";
import type { Evidence, Station } from "@/content/types";

export type Vec3 = [number, number, number];

export interface Shot {
  stationIndex: number;
  target: Vec3;
  position: Vec3;
}

export interface FramingOptions {
  aspect: number;
  fovDegrees: number;
  padding: number;
  safeTop: number;
  safeBottom: number;
}

const PORTRAIT_ASPECT = 0.9;

export const CAMERA_FOV = 35;

export const framingFor = (aspect: number): FramingOptions => {
  const portrait = aspect < PORTRAIT_ASPECT;
  return {
    aspect,
    fovDegrees: CAMERA_FOV,
    padding: portrait ? 1.08 : 1.2,
    safeTop: portrait ? 0.14 : 0.1,
    safeBottom: portrait ? 0.2 : 0.16,
  };
};

const PORTRAIT_GROUP = 2;
const BOARD_SURFACE_Z = 0.05;
const OVERVIEW_PADDING = 1.03;

const chunk = <T>(items: readonly T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
};

const boardBounds = (): Bounds => ({
  minX: -BOARD_SIZE.width / 2,
  maxX: BOARD_SIZE.width / 2,
  minY: -BOARD_SIZE.height / 2,
  maxY: BOARD_SIZE.height / 2,
});

export const distanceToFit = (bounds: Bounds, options: FramingOptions): number => {
  const { width, height } = extentOf(bounds);
  const tan = Math.tan((options.fovDegrees * Math.PI) / 360);
  const usableHeight = 1 - options.safeTop - options.safeBottom;
  const byHeight = (height * options.padding) / (2 * tan * usableHeight);
  const byWidth = (width * options.padding) / (2 * tan * options.aspect);
  return Math.max(byHeight, byWidth);
};

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (a: Vec3): Vec3 => {
  const length = Math.hypot(...a);
  return [a[0] / length, a[1] / length, a[2] / length];
};

export const fitsInView = (bounds: Bounds, position: Vec3, target: Vec3, options: FramingOptions) => {
  const forward = normalize(sub(target, position));
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const tan = Math.tan((options.fovDegrees * Math.PI) / 360);
  const corners: Vec3[] = [
    [bounds.minX, bounds.minY, BOARD_SURFACE_Z],
    [bounds.maxX, bounds.minY, BOARD_SURFACE_Z],
    [bounds.maxX, bounds.maxY, BOARD_SURFACE_Z],
    [bounds.minX, bounds.maxY, BOARD_SURFACE_Z],
  ];
  const limitX = options.aspect / options.padding;
  const top = (1 - 2 * options.safeTop) / options.padding;
  const bottom = (-1 + 2 * options.safeBottom) / options.padding;
  return corners.every((corner) => {
    const v = sub(corner, position);
    const depth = dot(v, forward);
    const x = dot(v, right) / (depth * tan);
    const y = dot(v, up) / (depth * tan);
    return Math.abs(x) <= limitX && y <= top && y >= bottom;
  });
};

const MAX_FIT_STEPS = 60;
const FIT_STEP = 1.025;

const shotFor = (stationIndex: number, station: Station, bounds: Bounds, base: FramingOptions): Shot => {
  const options = { ...base, safeBottom: Math.max(base.safeBottom, station.reserveBottom ?? 0) };
  const [yaw, pitch] = (station.angle ?? [0, 0]).map((degrees) => (degrees * Math.PI) / 180);
  const direction: Vec3 = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  const [cx, cy] = centerOf(bounds);
  const tan = Math.tan((options.fovDegrees * Math.PI) / 360);
  const place = (distance: number): Shot => {
    const verticalShift = (options.safeBottom - options.safeTop) * distance * tan;
    const target: Vec3 = [cx, cy - verticalShift, BOARD_SURFACE_Z];
    return {
      stationIndex,
      target,
      position: [
        target[0] + direction[0] * distance,
        target[1] + direction[1] * distance,
        target[2] + direction[2] * distance,
      ],
    };
  };
  let distance = distanceToFit(bounds, options) * 0.9;
  let shot = place(distance);
  for (let step = 0; step < MAX_FIT_STEPS && !fitsInView(bounds, shot.position, shot.target, options); step++) {
    distance *= FIT_STEP;
    shot = place(distance);
  }
  return shot;
};

export const buildShots = (stations: Station[], evidence: Evidence[], options: FramingOptions): Shot[] => {
  const byId = new Map(evidence.map((item) => [item.id, item]));
  const portrait = options.aspect < PORTRAIT_ASPECT;
  return stations.flatMap((station, stationIndex) => {
    if (station.focus === "all") return [shotFor(stationIndex, station, boardBounds(), { ...options, padding: OVERVIEW_PADDING })];
    const items = station.focus.map((id) => {
      const item = byId.get(id);
      if (!item) throw new Error(`Station ${station.id} references unknown evidence ${id}`);
      return item;
    });
    const groups = portrait ? chunk(items, PORTRAIT_GROUP) : [items];
    return groups.map((group) => shotFor(stationIndex, station, unionBounds(group.map(boundsOf)), options));
  });
};

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export interface ShotBlend {
  from: number;
  to: number;
  amount: number;
  nearest: number;
}

export const blendAt = (progress: number, shotCount: number, hold: number): ShotBlend => {
  const last = shotCount - 1;
  const t = Math.min(Math.max(progress, 0), last);
  const from = Math.min(Math.floor(t), Math.max(last - 1, 0));
  const local = t - from;
  const amount = last === 0 ? 0 : smootherstep(Math.min(Math.max((local - hold) / (1 - hold), 0), 1));
  return { from, to: Math.min(from + 1, last), amount, nearest: amount < 0.5 ? from : Math.min(from + 1, last) };
};
