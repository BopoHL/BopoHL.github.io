import { MathUtils, Vector3 } from "three";
import type { CameraMotion } from "./motion";
import { createPose, type RouteTrack } from "./routeTrack";
import { ScalarSpring, VectorSpring } from "./spring";

const MAX_STEP = 0.1;
const STOP_TOLERANCE = 0.01;
const SETTLED_SPEED = 0.15;

export interface Pointer {
  x: number;
  y: number;
}

export class RouteFollower {
  haste = 0;
  nearest = 0;
  private restingAt: number | null = null;
  private rested = 0;
  private readonly pose = createPose();
  private readonly aim = new Vector3();
  private readonly progressSpring = new ScalarSpring();
  private readonly positionSpring = new VectorSpring();
  private readonly targetSpring = new VectorSpring();
  private readonly rollSpring = new ScalarSpring();

  constructor(
    private readonly track: RouteTrack,
    private readonly motion: CameraMotion,
  ) {}

  get progress() {
    return this.progressSpring.value;
  }

  get position() {
    return this.positionSpring.value;
  }

  get target() {
    return this.targetSpring.value;
  }

  get roll() {
    return this.rollSpring.value;
  }

  get resting() {
    return this.restingAt;
  }

  reset(progress: number, position: Vector3, target: Vector3) {
    this.progressSpring.reset(progress);
    this.positionSpring.reset(position);
    this.targetSpring.reset(target);
    this.rollSpring.reset(0);
    this.restingAt = null;
  }

  private trackRest(step: number) {
    const current = this.progressSpring.value;
    const stop = Math.round(current);
    if (Math.abs(current - stop) >= STOP_TOLERANCE) this.restingAt = null;
    else if (this.restingAt !== stop) {
      this.restingAt = stop;
      this.rested = 0;
    } else if (this.positionSpring.velocity.length() < SETTLED_SPEED) this.rested += step;
  }

  private nextStopToward(progress: number): number {
    const current = this.progressSpring.value;
    const stop = Math.round(current);
    const atStop = this.restingAt === stop;
    const direction = Math.sign(progress - current);
    if (direction === 0) return progress;
    if (atStop && this.rested < this.motion.dwell && Math.abs(progress - stop) > STOP_TOLERANCE) return stop;
    const next = atStop ? stop + direction : direction > 0 ? Math.ceil(current) : Math.floor(current);
    return direction > 0 ? Math.min(progress, next) : Math.max(progress, next);
  }

  update(progress: number, delta: number, pointer: Pointer, traveling = false) {
    const { motion } = this;
    const step = Math.min(delta, MAX_STEP);
    this.trackRest(step);
    if (traveling) this.progressSpring.reset(progress);
    else {
      const limit = this.track.speedLimit(this.progressSpring.value, motion.browse);
      this.progressSpring.update(this.nextStopToward(progress), motion.progressSettle, step, limit);
    }
    this.haste = MathUtils.smoothstep(Math.abs(this.progressSpring.velocity), ...motion.haste);
    const pose = this.track.poseAt(this.progressSpring.value, this.haste, this.pose);
    this.nearest = pose.nearest;
    this.aim.copy(pose.position);
    this.aim.x += pointer.x * motion.parallax;
    this.aim.y += pointer.y * motion.parallax * 0.6;
    const settle = traveling ? motion.travelSettle : motion.settle;
    this.positionSpring.update(this.aim, settle, step);
    this.targetSpring.update(pose.target, settle, step);
    this.rollSpring.update(pose.roll, settle, step);
  }
}
