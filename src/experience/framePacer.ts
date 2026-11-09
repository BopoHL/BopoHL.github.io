export interface FrameRate {
  active: number;
  idle: number;
}

const SETTLE_MS = 1500;
const SLACK_MS = 1.5;
const MAX_STEP_MS = 100;

export class FramePacer {
  private awakeUntil = Number.NEGATIVE_INFINITY;
  private slot: number | null = null;
  private rendered = 0;
  private time = 0;
  private requested = false;

  constructor(private readonly rate: FrameRate) {}

  wake(now: number) {
    this.awakeUntil = Math.max(this.awakeUntil, now + SETTLE_MS);
  }

  request() {
    this.requested = true;
  }

  awake(now: number) {
    return now < this.awakeUntil;
  }

  next(now: number, paused: boolean): number | null {
    if (this.slot === null) {
      this.slot = this.rendered = now;
      return this.time;
    }
    const fps = paused ? 0 : this.awake(now) ? this.rate.active : this.rate.idle;
    const interval = fps > 0 ? 1000 / fps : Number.POSITIVE_INFINITY;
    const sinceSlot = now - this.slot;
    if (!this.requested && sinceSlot < interval - SLACK_MS) return null;
    this.requested = false;
    this.slot = sinceSlot < 2 * interval ? this.slot + interval : now;
    this.time += Math.min(now - this.rendered, MAX_STEP_MS) / 1000;
    this.rendered = now;
    return this.time;
  }
}
