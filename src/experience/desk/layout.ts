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

export const DESK_CENTER: Vec3 = [(DESK.minX + DESK.maxX) / 2, DESK.top, (DESK.back + DESK.front) / 2];

export const onDesk = ([x, z]: Vec2, lift = 0): Vec3 => [x, DESK.top + lift, z];

export const PROPS = {
  lamp: { at: [-9.2, 2.4] as Vec2, yaw: 18 },
  recorder: { at: [-4.4, 5.3] as Vec2, yaw: 14 },
  ashtray: { at: [3.1, 6.4] as Vec2, yaw: 0 },
  fan: { at: [8.4, 2.5] as Vec2, yaw: -38 },
} as const;
