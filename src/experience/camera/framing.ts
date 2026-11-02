import { BOARD_SIZE } from "@/content/board";
import { boundsOf, centerOf, extentOf, unionBounds, type Bounds } from "@/content/geometry";
import type { Evidence, Station } from "@/content/types";
import type { CameraStyle } from "../state/variant";

export type Vec3 = [number, number, number];

export interface Shot {
  stationIndex: number;
  target: Vec3;
  position: Vec3;
  roll: number;
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

export const framingFor = (aspect: number, style: CameraStyle = "classic"): FramingOptions => {
  const portrait = aspect < PORTRAIT_ASPECT;
  const cinema = style === "cinema";
  return {
    aspect,
    fovDegrees: CAMERA_FOV,
    padding: cinema ? 1.02 : portrait ? 1.08 : 1.2,
    safeTop: cinema ? (portrait ? 0.12 : 0.07) : portrait ? 0.14 : 0.1,
    safeBottom: cinema ? (portrait ? 0.2 : 0.15) : portrait ? 0.2 : 0.16,
  };
};

const PORTRAIT_GROUP = 2;
const BOARD_SURFACE_Z = 0.05;
const OVERVIEW_PADDING = 1.03;
const PAIR_AREA_RATIO = 1.8;
const PAIR_MIN_ASPECT = 1.15;
const DEGREE = Math.PI / 180;

const chunk = <T>(items: readonly T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
};

const areaOf = (bounds: Bounds) => {
  const { width, height } = extentOf(bounds);
  return width * height;
};

interface Level {
  options: FramingOptions;
  height: number;
}

const canShareFrame = (group: Evidence[], item: Evidence, level: Level) => {
  const members = [...group, item].map(boundsOf);
  const union = unionBounds(members);
  const { width, height } = extentOf(union);
  const separately = members.reduce((sum, bounds) => sum + areaOf(bounds), 0);
  return (
    width / height >= PAIR_MIN_ASPECT &&
    areaOf(union) <= separately * PAIR_AREA_RATIO &&
    distanceToFit(union, level.options) <= level.height
  );
};

const pairNeighbours = (items: Evidence[], maxPerShot: number, level: Level): Evidence[][] =>
  items.reduce<Evidence[][]>((groups, item) => {
    const current = groups.at(-1);
    if (current && current.length < maxPerShot && canShareFrame(current, item, level)) current.push(item);
    else groups.push([item]);
    return groups;
  }, []);



const hash01 = (seed: string) => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
  return ((hash >>> 0) % 10000) / 10000;
};

interface ShotAngle {
  yaw: number;
  pitch: number;
  roll: number;
}

const stationAngle = (station: Station): ShotAngle => {
  const [yaw, pitch] = station.angle ?? [0, 0];
  return { yaw: yaw * DEGREE, pitch: pitch * DEGREE, roll: 0 };
};

const cinematicAngle = (station: Station, shotNumber: number): ShotAngle => {
  const base = stationAngle(station);
  const side = shotNumber % 2 === 0 ? 1 : -1;
  const seed = `${station.id}-${shotNumber}`;
  return {
    yaw: base.yaw * 0.3 + side * (3 + 3 * hash01(`${seed}-yaw`)) * DEGREE,
    pitch: base.pitch * 0.3 + (hash01(`${seed}-pitch`) - 0.5) * 4 * DEGREE,
    roll: -side * (0.5 + 0.8 * hash01(`${seed}-roll`)) * DEGREE,
  };
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

export const fitsInView = (bounds: Bounds, position: Vec3, target: Vec3, options: FramingOptions, roll = 0) => {
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
  const cos = Math.cos(roll);
  const sin = Math.sin(roll);
  return corners.every((corner) => {
    const v = sub(corner, position);
    const depth = dot(v, forward);
    const screenX = dot(v, right) / (depth * tan);
    const screenY = dot(v, up) / (depth * tan);
    const x = screenX * cos + screenY * sin;
    const y = -screenX * sin + screenY * cos;
    return Math.abs(x) <= limitX && y <= top && y >= bottom;
  });
};

const MAX_FIT_STEPS = 60;
const FIT_STEP = 1.025;

const shotFor = (
  stationIndex: number,
  station: Station,
  bounds: Bounds,
  base: FramingOptions,
  angle: ShotAngle,
  minHeight = 0,
): Shot => {
  const options = { ...base, safeBottom: Math.max(base.safeBottom, station.reserveBottom ?? 0) };
  const { yaw, pitch, roll } = angle;
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
      roll,
    };
  };
  let distance = distanceToFit(bounds, options) * 0.9;
  let shot = place(distance);
  for (let step = 0; step < MAX_FIT_STEPS && !fitsInView(bounds, shot.position, shot.target, options, roll); step++) {
    distance *= FIT_STEP;
    shot = place(distance);
  }
  return distance * direction[2] < minHeight ? place(minHeight / direction[2]) : shot;
};

const groupsFor = (items: Evidence[], style: CameraStyle, portrait: boolean, level: Level): Evidence[][] => {
  if (style === "cinema") return pairNeighbours(items, portrait ? 1 : 2, level);
  return portrait ? chunk(items, PORTRAIT_GROUP) : [items];
};

const levelFor = (groups: Evidence[][], options: FramingOptions): Level => ({
  options,
  height: Math.max(...groups.map((group) => distanceToFit(unionBounds(group.map(boundsOf)), options))),
});

const isCalm = (station: Station, isLast: boolean) => station.focus === "all" || isLast;

export const buildShots = (
  stations: Station[],
  evidence: Evidence[],
  options: FramingOptions,
  style: CameraStyle = "classic",
): Shot[] => {
  const byId = new Map(evidence.map((item) => [item.id, item]));
  const portrait = options.aspect < PORTRAIT_ASPECT;
  const focusOf = (station: Station) =>
    station.focus === "all"
      ? []
      : station.focus.map((id) => {
          const item = byId.get(id);
          if (!item) throw new Error(`Station ${station.id} references unknown evidence ${id}`);
          return item;
        });
  const investigation = stations.filter((station, index) => !isCalm(station, index === stations.length - 1));
  const unitGroups =
    style === "cinema"
      ? investigation.flatMap((station) => focusOf(station).map((item) => [item]))
      : investigation.flatMap((station) => groupsFor(focusOf(station), style, portrait, { options, height: Infinity }));
  const level = levelFor(unitGroups, options);
  let shotNumber = 0;
  return stations.flatMap((station, stationIndex) => {
    const calm = isCalm(station, stationIndex === stations.length - 1);
    const angleFor = () => (style === "cinema" && !calm ? cinematicAngle(station, shotNumber++) : stationAngle(station));
    if (station.focus === "all") {
      return [shotFor(stationIndex, station, boardBounds(), { ...options, padding: OVERVIEW_PADDING }, angleFor())];
    }
    return groupsFor(focusOf(station), style, portrait, level).map((group) =>
      shotFor(stationIndex, station, unionBounds(group.map(boundsOf)), options, angleFor(), calm ? 0 : level.height),
    );
  });
};

export interface ShotBlend {
  from: number;
  to: number;
  raw: number;
  nearest: number;
}

export const blendAt = (progress: number, shotCount: number, hold: number): ShotBlend => {
  const last = shotCount - 1;
  const t = Math.min(Math.max(progress, 0), last);
  const from = Math.min(Math.floor(t), Math.max(last - 1, 0));
  const local = t - from;
  const raw = last === 0 ? 0 : Math.min(Math.max((local - hold) / (1 - hold), 0), 1);
  return { from, to: Math.min(from + 1, last), raw, nearest: raw < 0.5 ? from : Math.min(from + 1, last) };
};
