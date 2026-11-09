import { describe, expect, it } from "vitest";
import { FramePacer } from "../framePacer";

const RATE = { active: 60, idle: 30 };

const run = (pacer: FramePacer, hz: number, seconds: number, from = 0, paused = false) => {
  const times: number[] = [];
  for (let frame = 0; frame < Math.round(hz * seconds); frame++) {
    const time = pacer.next(from + (frame * 1000) / hz, paused);
    if (time !== null) times.push(time);
  }
  return times;
};

describe("FramePacer", () => {
  it("draws every frame of a 60 Hz display while the visitor is busy", () => {
    const pacer = new FramePacer(RATE);
    pacer.wake(0);
    expect(run(pacer, 60, 1)).toHaveLength(60);
  });

  it("drops to the idle rate once things settle", () => {
    const pacer = new FramePacer(RATE);
    pacer.wake(0);
    run(pacer, 60, 2);
    expect(run(pacer, 60, 1, 2000).length).toBeCloseTo(30, -1);
  });

  it("caps a 120 Hz display at the active rate", () => {
    const pacer = new FramePacer(RATE);
    pacer.wake(0);
    expect(run(pacer, 120, 1)).toHaveLength(60);
  });

  it("keeps the average rate on a display it does not divide", () => {
    const pacer = new FramePacer(RATE);
    pacer.wake(0);
    expect(run(pacer, 144, 1).length).toBeGreaterThanOrEqual(58);
  });

  it("stops while paused but still draws a requested frame", () => {
    const pacer = new FramePacer(RATE);
    run(pacer, 60, 0.5);
    expect(run(pacer, 60, 1, 500, true)).toHaveLength(0);
    pacer.request();
    expect(run(pacer, 60, 0.1, 1500, true)).toHaveLength(1);
  });

  it("advances scene time by real time, but never by a long gap at once", () => {
    const pacer = new FramePacer(RATE);
    pacer.wake(0);
    const times = run(pacer, 60, 1);
    expect(times.at(-1)).toBeCloseTo(59 / 60, 3);
    pacer.wake(60_000);
    const resumed = pacer.next(60_000, false);
    expect(resumed! - times.at(-1)!).toBeCloseTo(0.1, 6);
  });
});
