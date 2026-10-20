import type { Evidence, EvidenceKind, TypedPaper, Vec2 } from "./types";

const KIND_ASPECT: Record<Exclude<EvidenceKind, "typed">, number> = {
  newspaper: 0.92,
  sticky: 1,
  scrap: 0.52,
  photo: 1.2,
  chart: 0.74,
  badge: 1.36,
  certificate: 0.7,
  redacted: 1.25,
  tag: 0.56,
  folder: 0.74,
};

const PAPER_ASPECT: Record<TypedPaper, number> = {
  index: 0.6,
  sheet: 1.3,
  manila: 0.3,
};

const MUGSHOT_ASPECT = 1.25;
const STUDENT_ID_ASPECT = 0.63;

const PIN_INSET = 0.16;

export const aspectOf = (item: Evidence): number => {
  if (item.aspect) return item.aspect;
  switch (item.kind) {
    case "typed":
      return PAPER_ASPECT[item.paper];
    case "photo":
      return item.frame === "mugshot" ? MUGSHOT_ASPECT : KIND_ASPECT.photo;
    case "badge":
      return item.style === "student" ? STUDENT_ID_ASPECT : KIND_ASPECT.badge;
    default:
      return KIND_ASPECT[item.kind];
  }
};

export interface Size {
  width: number;
  height: number;
}

export const sizeOf = (item: Evidence): Size => ({
  width: item.width,
  height: item.width * aspectOf(item),
});

const rotate = ([x, y]: Vec2, degrees: number): Vec2 => {
  const r = (degrees * Math.PI) / 180;
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
};

export const pinOf = (item: Evidence): Vec2 => {
  const { height } = sizeOf(item);
  const [dx, dy] = rotate([0, height / 2 - PIN_INSET], item.rotation);
  return [item.position[0] + dx, item.position[1] + dy];
};

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const boundsOf = (item: Evidence): Bounds => {
  const { width, height } = sizeOf(item);
  const local: Vec2[] = [
    [-width / 2, -height / 2],
    [width / 2, -height / 2],
    [width / 2, height / 2],
    [-width / 2, height / 2],
  ];
  const corners = local.map((corner) => rotate(corner, item.rotation));
  const xs = corners.map(([x]) => x + item.position[0]);
  const ys = corners.map(([, y]) => y + item.position[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
};

export const unionBounds = (bounds: Bounds[]): Bounds => ({
  minX: Math.min(...bounds.map((b) => b.minX)),
  maxX: Math.max(...bounds.map((b) => b.maxX)),
  minY: Math.min(...bounds.map((b) => b.minY)),
  maxY: Math.max(...bounds.map((b) => b.maxY)),
});

export const centerOf = (b: Bounds): Vec2 => [(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2];

export const extentOf = (b: Bounds): Size => ({ width: b.maxX - b.minX, height: b.maxY - b.minY });
