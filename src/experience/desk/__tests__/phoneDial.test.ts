import { describe, expect, it } from "vitest";
import { Dialer, pulsesFor, windAngleFor } from "../phoneDial";

const run = (dialer: Dialer, seconds: number, step = 1 / 60) => {
  let pulses = 0;
  for (let t = 0; t < seconds; t += step) pulses += dialer.update(step);
  return pulses;
};

describe("rotary dial", () => {
  it("sends as many pulses as the digit, ten for zero", () => {
    expect(pulsesFor(4)).toBe(4);
    expect(pulsesFor(0)).toBe(10);
    expect(windAngleFor(0)).toBeGreaterThan(windAngleFor(9));
  });

  it("dials a whole number and comes to rest", () => {
    const dialer = new Dialer();
    expect(dialer.dial("404")).toBe(true);
    expect(dialer.dial("1")).toBe(false);
    const pulses = run(dialer, 12);
    expect(pulses).toBe(4 + 10 + 4);
    expect(dialer.busy).toBe(false);
    expect(dialer.angle).toBe(0);
  });
});
