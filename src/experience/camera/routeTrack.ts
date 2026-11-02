import { MathUtils, Vector3 } from "three";
import { blendAt, type Shot } from "./framing";
import { moveTiming, type CameraMotion, type Pace } from "./motion";

export interface RoutePose {
  position: Vector3;
  target: Vector3;
  roll: number;
  nearest: number;
}

export const createPose = (): RoutePose => ({ position: new Vector3(), target: new Vector3(), roll: 0, nearest: 0 });

const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export class RouteTrack {
  private readonly fromPosition = new Vector3();
  private readonly toPosition = new Vector3();

  constructor(
    private readonly shots: Shot[],
    private readonly motion: CameraMotion,
  ) {}

  get length() {
    return this.shots.length;
  }

  stationOf(shot: number) {
    return this.shots[shot].stationIndex;
  }

  speedLimit(progress: number, pace: Pace): number {
    const { from, to } = blendAt(progress, this.shots.length, 0);
    const start = this.shots[from];
    const end = this.shots[to];
    const span = Math.max(distance(start.position, end.position), distance(start.target, end.target));
    const height = Math.max(start.position[2] - start.target[2], end.position[2] - end.target[2]);
    const heights = span / height;
    const calm = heights > 0 ? (pace.heightsPerSecond * (1 - this.motion.hold)) / (heights * this.motion.easePeak) : Infinity;
    return Math.min(pace.maxShotsPerSecond, calm);
  }

  poseAt(progress: number, haste: number, out: RoutePose): RoutePose {
    const { motion } = this;
    const calm = 1 - haste;
    const blend = blendAt(progress, this.shots.length, motion.hold * calm);
    const from = this.shots[blend.from];
    const to = this.shots[blend.to];
    const timing = moveTiming(blend.raw, motion);
    const travel = MathUtils.lerp(blend.raw, timing.travel, calm);
    const gaze = MathUtils.lerp(blend.raw, timing.gaze, calm);
    this.fromPosition.set(...from.position);
    this.toPosition.set(...to.position);
    out.position.lerpVectors(this.fromPosition, this.toPosition, travel);
    out.target.set(
      MathUtils.lerp(from.target[0], to.target[0], gaze),
      MathUtils.lerp(from.target[1], to.target[1], gaze),
      MathUtils.lerp(from.target[2], to.target[2], gaze),
    );
    out.roll = MathUtils.lerp(from.roll, to.roll, travel) * calm;
    out.nearest = blend.nearest;
    return out;
  }
}
