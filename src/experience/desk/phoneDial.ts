const HOLE_SPACING = (Math.PI * 2) / 13;
const STOP_OFFSET = 3.5;

export const DIAL = {
  holeSpacing: HOLE_SPACING,
  firstHole: Math.PI / 3,
  stop: Math.PI / 3 - STOP_OFFSET * HOLE_SPACING,
  windSpeed: 5.5,
  returnSpeed: 7.5,
  pause: 0.25,
};

export const pulsesFor = (digit: number) => (digit === 0 ? 10 : digit);

export const windAngleFor = (digit: number) => (pulsesFor(digit) - 1 + STOP_OFFSET) * DIAL.holeSpacing;

type Phase = "idle" | "wind" | "return" | "pause";

export class Dialer {
  angle = 0;
  private phase: Phase = "idle";
  private queue: number[] = [];
  private target = 0;
  private pulsesLeft = 0;
  private pulseEvery = 0;
  private sincePulse = 0;
  private waited = 0;

  get busy() {
    return this.phase !== "idle";
  }

  dial(number: string) {
    if (this.busy) return false;
    this.queue = [...number].map(Number).filter((digit) => Number.isInteger(digit));
    this.next();
    return true;
  }

  update(delta: number): number {
    let pulses = 0;
    if (this.phase === "wind") {
      this.angle = Math.min(this.target, this.angle + DIAL.windSpeed * delta);
      if (this.angle >= this.target) this.phase = "return";
    } else if (this.phase === "return") {
      this.angle = Math.max(0, this.angle - DIAL.returnSpeed * delta);
      this.sincePulse += DIAL.returnSpeed * delta;
      while (this.pulsesLeft > 0 && this.sincePulse >= this.pulseEvery) {
        this.sincePulse -= this.pulseEvery;
        this.pulsesLeft -= 1;
        pulses += 1;
      }
      if (this.angle <= 0) {
        pulses += this.pulsesLeft;
        this.pulsesLeft = 0;
        this.phase = "pause";
        this.waited = 0;
      }
    } else if (this.phase === "pause") {
      this.waited += delta;
      if (this.waited >= DIAL.pause) this.next();
    }
    return pulses;
  }

  private next() {
    const digit = this.queue.shift();
    if (digit === undefined) {
      this.phase = "idle";
      return;
    }
    this.target = windAngleFor(digit);
    this.pulsesLeft = pulsesFor(digit);
    this.pulseEvery = this.target / this.pulsesLeft;
    this.sincePulse = 0;
    this.phase = "wind";
  }
}
