import { describe, expect, it } from "vitest";
import { TapeDeck } from "../tape";

const RECORDING = { src: "tape.mp3", seconds: 78 };

const run = (deck: TapeDeck, seconds: number, step = 0.1) => {
  let ranOut = false;
  for (let t = 0; t < seconds; t += step) ranOut = deck.update(step) || ranOut;
  return ranOut;
};

describe("TapeDeck", () => {
  it("plays forward in real time and latches the play key", () => {
    const deck = new TapeDeck(RECORDING);
    expect(deck.press("play")).toBe(true);
    run(deck, 2);
    expect(deck.isLatched("play")).toBe(true);
    expect(deck.position).toBeCloseTo(2, 1);
  });

  it("holds the tape while pause is latched", () => {
    const deck = new TapeDeck(RECORDING);
    deck.press("play");
    run(deck, 1);
    expect(deck.press("pause")).toBe(true);
    const held = deck.position;
    run(deck, 1);
    expect(deck.position).toBe(held);
    expect(deck.press("pause")).toBe(false);
    run(deck, 1);
    expect(deck.position).toBeGreaterThan(held);
  });

  it("rewinds much faster than it plays and pops the key at the start", () => {
    const deck = new TapeDeck(RECORDING);
    deck.press("play");
    run(deck, 6);
    expect(deck.press("rewind")).toBe(true);
    expect(deck.isLatched("play")).toBe(false);
    expect(run(deck, 1)).toBe(true);
    expect(deck.position).toBe(0);
    expect(deck.isLatched("rewind")).toBe(false);
  });

  it("stops by itself at the end of the tape", () => {
    const deck = new TapeDeck(RECORDING);
    deck.press("forward");
    expect(run(deck, deck.duration)).toBe(true);
    expect(deck.position).toBeCloseTo(deck.duration, 1);
    expect(deck.press("forward")).toBe(false);
    expect(deck.press("play")).toBe(true);
    expect(deck.update(0.1)).toBe(true);
    expect(deck.isLatched("play")).toBe(false);
  });

  it("releases every key on stop and never records over the evidence", () => {
    const deck = new TapeDeck(RECORDING);
    deck.press("play");
    deck.press("pause");
    expect(deck.press("stop")).toBe(false);
    expect(deck.isLatched("play")).toBe(false);
    expect(deck.isLatched("pause")).toBe(false);
    expect(deck.press("record")).toBe(false);
    expect(deck.isLatched("record")).toBe(false);
  });

  it("on repeat, rewinds at the end of the tape and plays it again", () => {
    const deck = new TapeDeck(RECORDING, { repeat: true });
    deck.press("play");
    deck.position = deck.duration - 0.5;
    expect(run(deck, 1)).toBe(true);
    expect(deck.isLatched("rewind")).toBe(true);
    run(deck, deck.duration / 10);
    expect(deck.isLatched("play")).toBe(true);
    expect(deck.position).toBeLessThan(5);
  });

  it("forgets the replay once a key is pressed", () => {
    const deck = new TapeDeck(RECORDING, { repeat: true });
    deck.press("play");
    deck.position = deck.duration - 0.5;
    run(deck, 1);
    deck.press("stop");
    run(deck, deck.duration / 10);
    expect(deck.isLatched("play")).toBe(false);
    expect(deck.engaged).toBe(false);
  });
});
