import { describe, expect, it } from "vitest";
import { boardContentFor } from "@/content/selectors";
import { creaseHeight, curlHeight, wearHeight } from "../height";
import { wearFor } from "../profile";

const { evidence } = boardContentFor("reveal");
const grid = Array.from({ length: 11 }, (_, i) => i / 10 - 0.5);

describe("wearFor", () => {
  it("is deterministic per evidence", () => {
    for (const item of evidence) expect(wearFor(item)).toEqual(wearFor(item));
  });

  it("never lifts paper behind the board", () => {
    for (const item of evidence) {
      const wear = wearFor(item);
      for (const u of grid) for (const v of grid) expect(wearHeight(wear, u, v)).toBeGreaterThanOrEqual(0);
    }
  });

  it("keeps laminated badges and the mugshot flat", () => {
    for (const item of evidence) {
      if (item.kind === "badge" || (item.kind === "photo" && item.frame === "mugshot")) {
        const wear = wearFor(item);
        expect(wear.creases).toHaveLength(0);
        expect(wear.curls).toHaveLength(0);
      }
    }
  });

  it("wears newspapers harder than notes", () => {
    const scuffs = (kind: string) =>
      evidence.filter((item) => item.kind === kind).map((item) => wearFor(item).scuffs);
    expect(Math.min(...scuffs("newspaper"))).toBeGreaterThan(Math.max(...scuffs("sticky")));
  });
});

describe("wear height", () => {
  it("peaks a ridge crease on its fold line", () => {
    const crease = { axis: "horizontal" as const, position: 0, depth: 0.03, spread: 0.5, ridge: true };
    expect(creaseHeight(crease, 0.2, 0)).toBeCloseTo(0.03);
    expect(creaseHeight(crease, 0.2, 0.5)).toBeCloseTo(0);
  });

  it("lifts only the curled corner", () => {
    const curl = { corner: "bottomRight" as const, size: 0.3, lift: 0.05 };
    expect(curlHeight(curl, 0.5, -0.5)).toBeCloseTo(0.05);
    expect(curlHeight(curl, -0.5, 0.5)).toBe(0);
  });
});
