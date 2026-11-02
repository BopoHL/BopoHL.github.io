import { Vector3 } from "three";

interface SpringStep {
  value: number;
  velocity: number;
}

export const smoothDamp = (
  current: number,
  target: number,
  velocity: number,
  smoothTime: number,
  delta: number,
  maxSpeed = Number.POSITIVE_INFINITY,
): SpringStep => {
  if (delta <= 0) return { value: current, velocity };
  const time = Math.max(smoothTime, 1e-4);
  const omega = 2 / time;
  const x = omega * delta;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const reach = maxSpeed * time;
  const offset = Math.min(Math.max(current - target, -reach), reach);
  const temp = (velocity + omega * offset) * delta;
  const value = current - offset + (offset + temp) * decay;
  const overshot = target - current > 0 === value > target;
  return overshot ? { value: target, velocity: 0 } : { value, velocity: (velocity - omega * temp) * decay };
};

export class ScalarSpring {
  value: number;
  velocity = 0;

  constructor(initial = 0) {
    this.value = initial;
  }

  reset(value: number) {
    this.value = value;
    this.velocity = 0;
  }

  update(target: number, smoothTime: number, delta: number, maxSpeed?: number) {
    const step = smoothDamp(this.value, target, this.velocity, smoothTime, delta, maxSpeed);
    this.value = step.value;
    this.velocity = step.velocity;
    return this.value;
  }
}

export class VectorSpring {
  readonly value = new Vector3();
  readonly velocity = new Vector3();

  reset(value: Vector3) {
    this.value.copy(value);
    this.velocity.set(0, 0, 0);
  }

  update(target: Vector3, smoothTime: number, delta: number) {
    for (const axis of ["x", "y", "z"] as const) {
      const step = smoothDamp(this.value[axis], target[axis], this.velocity[axis], smoothTime, delta);
      this.value[axis] = step.value;
      this.velocity[axis] = step.velocity;
    }
    return this.value;
  }
}
