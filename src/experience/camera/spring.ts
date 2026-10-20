import { Vector3 } from "three";

interface SpringStep {
  value: number;
  velocity: number;
}

export const smoothDamp = (current: number, target: number, velocity: number, smoothTime: number, delta: number): SpringStep => {
  if (delta <= 0) return { value: current, velocity };
  const omega = 2 / Math.max(smoothTime, 1e-4);
  const x = omega * delta;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const offset = current - target;
  const temp = (velocity + omega * offset) * delta;
  return {
    value: target + (offset + temp) * decay,
    velocity: (velocity - omega * temp) * decay,
  };
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

  update(target: number, smoothTime: number, delta: number) {
    const step = smoothDamp(this.value, target, this.velocity, smoothTime, delta);
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
