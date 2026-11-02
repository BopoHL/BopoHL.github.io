import { MathUtils, Vector3 } from "three";
import type { CameraMotion } from "./motion";
import { createPose, type RouteTrack } from "./routeTrack";
import { ScalarSpring, VectorSpring } from "./spring";

const MAX_STEP = 0.1;

export interface Pointer {
  x: number;
  y: number;
}

export class RouteFollower {
  haste = 0;
  nearest = 0;
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

  reset(progress: number, position: Vector3, target: Vector3) {
    this.progressSpring.reset(progress);
    this.positionSpring.reset(position);
    this.targetSpring.reset(target);
    this.rollSpring.reset(0);
  }

  update(progress: number, delta: number, pointer: Pointer) {
    const { motion } = this;
    const step = Math.min(delta, MAX_STEP);
    this.progressSpring.update(progress, motion.progressSettle, step, motion.maxShotsPerSecond);
    this.haste = MathUtils.smoothstep(Math.abs(this.progressSpring.velocity), ...motion.haste);
    const pose = this.track.poseAt(this.progressSpring.value, this.haste, this.pose);
    this.nearest = pose.nearest;
    this.aim.copy(pose.position);
    this.aim.x += pointer.x * motion.parallax;
    this.aim.y += pointer.y * motion.parallax * 0.6;
    this.positionSpring.update(this.aim, motion.settle, step);
    this.targetSpring.update(pose.target, motion.settle, step);
    this.rollSpring.update(pose.roll, motion.settle, step);
  }
}
