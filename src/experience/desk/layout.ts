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
  lamp: { at: [-8.3, 2.2] as Vec2, yaw: 18 },
  recorder: { at: [-4.4, 5.3] as Vec2, yaw: 14 },
  ashtray: { at: [2.85, 7.4] as Vec2, yaw: 0, scale: 0.9 },
  fan: { at: [7.4, 2.5] as Vec2, yaw: -40 },
  typewriter: { at: [-9.0, 6.2] as Vec2, yaw: 22 },
} as const;
