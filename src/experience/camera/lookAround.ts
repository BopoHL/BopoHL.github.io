import { MathUtils, Vector3 } from "three";
import { BOARD_SIZE } from "@/content/board";
import { DESK, PROPS } from "../desk/layout";
import { CAMERA_FOV } from "./framing";

export type Place = "board" | "desk";
export type LookRequest = Place | "leave";

export interface Aim {
  u: number;
  v: number;
}

export interface Pose {
  position: Vector3;
  target: Vector3;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const LOOK = {
  deskEdge: 0.93,
  boardEdge: 0.07,
  dwell: 0.35,
  boardBand: { top: 0.1, bottom: 0.86 },
  boardMargin: 0.6,
  boardDistance: { min: 6, max: 30, start: 17 },
  deskScale: { min: 0.5, max: 1.15, start: 1 },
  deskReach: { x: 1.5, far: 2.2, near: 0.4 },
  turn: { yaw: 0.1, pitch: 0.06 },
  card: { side: 0.4, top: 0.4, bottom: 0.9, closest: 3.5 },
  leaveAfter: Math.log(1.6),
  overzoomDecay: 3,
  pullback: 0.25,
  keyStep: 0.06,
  keyZoom: 0.15,
} as const;

const TAN_HALF = Math.tan(MathUtils.degToRad(CAMERA_FOV / 2));
const DESK_TARGET = new Vector3(0, DESK.top - 0.2, (DESK.back + DESK.front) / 2 + 1);
const DESK_OFFSET = new Vector3(0, 13.4, 14.6);
const DESK_DISTANCE = DESK_OFFSET.length();
const DESK_HALF_WIDTH = (DESK.maxX - DESK.minX) / 2;

const clamp01 = (value: number) => MathUtils.clamp(value, 0, 1);

export const createPose = (): Pose => ({ position: new Vector3(), target: new Vector3() });

export const boardPose = (aim: Aim, distance: number, aspect: number, turn: number, out: Pose) => {
  const halfHeight = distance * TAN_HALF;
  const halfWidth = halfHeight * aspect;
  const rangeX = Math.max(0, BOARD_SIZE.width / 2 + LOOK.boardMargin - halfWidth);
  const rangeY = Math.max(0, BOARD_SIZE.height / 2 + LOOK.boardMargin - halfHeight);
  const across = 2 * aim.u - 1;
  const up = 1 - 2 * clamp01((aim.v - LOOK.boardBand.top) / (LOOK.boardBand.bottom - LOOK.boardBand.top));
  out.target.set(across * rangeX, up * rangeY, 0);
  const yaw = across * LOOK.turn.yaw * turn;
  const pitch = up * LOOK.turn.pitch * turn;
  out.position.set(
    out.target.x - Math.sin(yaw) * distance,
    out.target.y - Math.sin(pitch) * distance,
    Math.cos(yaw) * Math.cos(pitch) * distance,
  );
  return out;
};

export const deskPose = (aim: Aim, scale: number, aspect: number, turn: number, out: Pose) => {
  const distance = DESK_DISTANCE * scale;
  const halfWidth = distance * TAN_HALF * aspect;
  const rangeX = Math.max(DESK_HALF_WIDTH - halfWidth, LOOK.deskReach.x);
  const across = 2 * aim.u - 1;
  const up = 1 - 2 * clamp01(aim.v);
  const reachZ = up > 0 ? LOOK.deskReach.far : LOOK.deskReach.near;
  out.target.set(DESK_TARGET.x + across * rangeX, DESK_TARGET.y, DESK_TARGET.z - up * reachZ);
  out.position.copy(DESK_OFFSET).multiplyScalar(scale).add(out.target);
  out.position.x -= Math.sin(across * LOOK.turn.yaw * turn) * distance;
  return out;
};

export const cardPose = (bounds: Bounds, aspect: number, covered: number, out: Pose) => {
  const { side, top, bottom, closest } = LOOK.card;
  const width = bounds.maxX - bounds.minX + 2 * side;
  const height = bounds.maxY - bounds.minY + top + bottom;
  const distance = Math.max(closest, height / 2 / TAN_HALF, width / 2 / (TAN_HALF * aspect * (1 - covered)));
  const halfWidth = distance * TAN_HALF * aspect;
  out.target.set((bounds.minX + bounds.maxX) / 2 + covered * halfWidth, (bounds.minY - bottom + bounds.maxY + top) / 2, 0);
  out.position.set(out.target.x, out.target.y, distance);
  return out;
};

const typewriterPose = (): Pose => {
  const [x, z] = PROPS.typewriter.at;
  const up = new Vector3(0, 1, 0);
  const yaw = MathUtils.degToRad(PROPS.typewriter.yaw);
  const target = new Vector3(x, DESK.top + 1.9, z - 0.5).add(new Vector3(1.7, 0, 0).applyAxisAngle(up, yaw));
  const position = target.clone().add(new Vector3(0, 4.4, 7.2).applyAxisAngle(up, yaw));
  return { position, target };
};

export const TYPEWRITER_POSE: Readonly<Pose> = typewriterPose();

export class LookAround {
  readonly aim: Aim = { u: 0.5, v: 0.5 };
  boardDistance: number = LOOK.boardDistance.start;
  deskScale: number = LOOK.deskScale.start;
  private overzoom = 0;
  private dwell = 0;
  private present = false;

  point(u: number, v: number) {
    this.aim.u = clamp01(u);
    this.aim.v = clamp01(v);
    this.present = true;
  }

  nudge(du: number, dv: number) {
    this.point(this.aim.u + du, this.aim.v + dv);
  }

  leave() {
    this.present = false;
    this.dwell = 0;
  }

  zoom(amount: number, place: Place) {
    const range = place === "board" ? LOOK.boardDistance : LOOK.deskScale;
    const current = place === "board" ? this.boardDistance : this.deskScale;
    const wanted = current * Math.exp(amount);
    const next = MathUtils.clamp(wanted, range.min, range.max);
    if (place === "board") this.boardDistance = next;
    else this.deskScale = next;
    if (wanted > range.max) this.overzoom += Math.log(wanted / range.max);
    else if (amount < 0) this.overzoom = 0;
  }

  arrive(place: Place) {
    if (place === "desk") this.deskScale = LOOK.deskScale.start;
    this.overzoom = 0;
    this.dwell = 0;
  }

  pullback() {
    return 1 + this.overzoom * LOOK.pullback;
  }

  update(place: Place, delta: number): LookRequest | null {
    this.overzoom *= Math.exp(-LOOK.overzoomDecay * delta);
    if (this.overzoom >= LOOK.leaveAfter) {
      this.overzoom = 0;
      return place === "desk" ? "board" : "leave";
    }
    if (!this.present) return null;
    const atEdge = place === "board" ? this.aim.v >= LOOK.deskEdge : this.aim.v <= LOOK.boardEdge;
    this.dwell = atEdge ? this.dwell + delta : 0;
    if (this.dwell < LOOK.dwell) return null;
    this.dwell = 0;
    return place === "board" ? "desk" : "board";
  }
}
