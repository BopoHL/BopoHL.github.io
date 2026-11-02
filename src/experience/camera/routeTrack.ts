import { MathUtils, Vector3 } from "three";
import { blendAt, type Shot } from "./framing";
import { moveTiming, type CameraMotion } from "./motion";

const BOARD_NORMAL = new Vector3(0, 0, 1);

export interface RoutePose {
  position: Vector3;
  target: Vector3;
  roll: number;
  nearest: number;
}

export const createPose = (): RoutePose => ({ position: new Vector3(), target: new Vector3(), roll: 0, nearest: 0 });

export class RouteTrack {
  private readonly fromTarget = new Vector3();
  private readonly toTarget = new Vector3();
  private readonly fromPosition = new Vector3();
  private readonly toPosition = new Vector3();
  private readonly control = new Vector3();
  private readonly side = new Vector3();

  constructor(
    private readonly shots: Shot[],
    private readonly motion: CameraMotion,
  ) {}

  poseAt(progress: number, haste: number, out: RoutePose): RoutePose {
    const { motion } = this;
    const calm = 1 - haste;
    const blend = blendAt(progress, this.shots.length, motion.hold * calm);
    const from = this.shots[blend.from];
    const to = this.shots[blend.to];
    const timing = moveTiming(blend.raw, motion);
    const travel = MathUtils.lerp(blend.raw, timing.travel, calm);
    const gaze = MathUtils.lerp(blend.raw, timing.gaze, calm);
    this.fromTarget.set(...from.target);
    this.toTarget.set(...to.target);
    this.fromPosition.set(...from.position);
    this.toPosition.set(...to.position);

    const distance = this.fromTarget.distanceTo(this.toTarget);
    const pullback =
      distance > 0.01 ? MathUtils.clamp(distance * motion.pullback, motion.minPullback, motion.maxPullback) * calm : 0;
    const swingSide = blend.from % 2 === 0 ? 1 : -1;
    this.side.subVectors(this.toTarget, this.fromTarget).cross(BOARD_NORMAL).normalize();
    this.control
      .addVectors(this.fromPosition, this.toPosition)
      .multiplyScalar(0.5)
      .addScaledVector(BOARD_NORMAL, pullback * 2)
      .addScaledVector(this.side, swingSide * distance * motion.swing * calm);

    const inverse = 1 - travel;
    out.position
      .copy(this.fromPosition)
      .multiplyScalar(inverse * inverse)
      .addScaledVector(this.control, 2 * inverse * travel)
      .addScaledVector(this.toPosition, travel * travel)
      .addScaledVector(BOARD_NORMAL, motion.travelLift * haste);
    out.target.lerpVectors(this.fromTarget, this.toTarget, gaze);
    const bank = Math.sin(Math.PI * travel) * motion.bank * swingSide;
    out.roll = (MathUtils.lerp(from.roll, to.roll, travel) + bank) * calm;
    out.nearest = blend.nearest;
    return out;
  }
}
