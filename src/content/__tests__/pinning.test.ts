import { describe, expect, it } from "vitest";
import { boundsOf, pinOf } from "../geometry";
import { pinBoard } from "../pinning";
import { boardContentFor } from "../selectors";

const { evidence, threads } = boardContentFor("reveal");
const pinning = pinBoard(evidence, threads);
const byId = new Map(evidence.map((item) => [item.id, item]));

describe("pinBoard", () => {
  it("pins every card at the top", () => {
    for (const item of evidence) expect(pinning.spots.get(item.id)).toContain("top");
  });

  it("adds a bottom pin only where a thread leaves from it", () => {
    for (const [id, spots] of pinning.spots) {
      if (!spots.includes("bottom")) continue;
      const usesBottom = pinning.threads.some(
        (thread) => (thread.from === id && thread.fromSpot === "bottom") || (thread.to === id && thread.toSpot === "bottom"),
      );
      expect(usesBottom).toBe(true);
    }
  });

  it("leaves a card downwards from its bottom pin instead of crossing it", () => {
    const thread = pinning.threads.find((candidate) => candidate.from === "alif-chart" && candidate.to === "alif-question");
    expect(thread?.fromSpot).toBe("bottom");
    expect(thread?.toSpot).toBe("top");
  });

  it("keeps each anchor on its card", () => {
    for (const thread of pinning.threads) {
      const item = byId.get(thread.from)!;
      const [x, y] = pinOf(item, thread.fromSpot);
      const bounds = boundsOf(item);
      expect(x).toBeGreaterThan(bounds.minX);
      expect(x).toBeLessThan(bounds.maxX);
      expect(y).toBeGreaterThan(bounds.minY);
      expect(y).toBeLessThan(bounds.maxY);
    }
  });
});
