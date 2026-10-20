import { describe, expect, it } from "vitest";
import { distanceOutside, toWorld } from "../geometry";
import type { Evidence } from "../types";

const card = {
  id: "card",
  kind: "sticky",
  area: "case",
  position: [2, 1],
  rotation: 90,
  width: 2,
  text: { ru: "", en: "" },
} as Evidence;

describe("evidence geometry", () => {
  it("maps local points through the card rotation", () => {
    const [x, y] = toWorld(card, [1, 0]);
    expect(x).toBeCloseTo(2);
    expect(y).toBeCloseTo(2);
  });

  it("measures zero distance inside the card", () => {
    expect(distanceOutside(card, [2.5, 1.5])).toBe(0);
  });

  it("measures distance from the rotated edge outside the card", () => {
    expect(distanceOutside(card, [2, 3])).toBeCloseTo(1);
  });
});
