import type { Vec2 } from "@/content/types";

export type Vec3 = [number, number, number];

export const DESK = {
  top: -10.6,
  thickness: 0.4,
  minX: -12,
  maxX: 12,
  back: -0.3,
  front: 8.5,
  apron: 1.3,
  leg: 0.7,
  floor: -21.3,
} as const;

export const DRAWER = { width: 5.2, height: 0.9, inset: 0.6, travel: 2.6, depth: 2.9 } as const;

export const drawerAnchor = (side: -1 | 1): Vec3 => [
  (DESK.minX + DESK.maxX) / 2 + (side * (DESK.maxX - DESK.minX)) / 4,
  DESK.top - DESK.thickness - DESK.apron / 2,
  DESK.front - DRAWER.inset + 0.17,
];

export const DESK_CENTER: Vec3 = [(DESK.minX + DESK.maxX) / 2, DESK.top, (DESK.back + DESK.front) / 2];

export const onDesk = ([x, z]: Vec2, lift = 0): Vec3 => [x, DESK.top + lift, z];

export const PROPS = {
  lamp: { at: [-8.3, 2.2] as Vec2, yaw: 18 },
  recorder: { at: [-3.6, 5.0] as Vec2, yaw: 14 },
  ashtray: { at: [2.85, 7.4] as Vec2, yaw: 0, scale: 0.9 },
  fan: { at: [7.4, 2.5] as Vec2, yaw: -40 },
  typewriter: { at: [-8.0, 6.5] as Vec2, yaw: 22 },
  phone: { at: [8.3, 6.6] as Vec2, yaw: -24 },
} as const;
