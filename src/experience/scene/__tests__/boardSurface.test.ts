import { describe, expect, it } from "vitest";
import { distanceOutside, pinOffsetOf, toLocal } from "@/content/geometry";
import { boardContentFor } from "@/content/selectors";
import { BoardSurface } from "../boardSurface";
import { THREAD_RADIUS } from "../threadShader";

const { evidence, threads } = boardContentFor("reveal");
const surface = new BoardSurface(evidence, threads);

describe("BoardSurface", () => {
  it("drapes every thread on or above the paper it crosses", () => {
    for (const { points } of surface.runs) {
      for (const point of points.slice(1, -1)) {
        expect(point.z).toBeGreaterThanOrEqual(surface.heightAt([point.x, point.y]) + THREAD_RADIUS - 1e-6);
      }
    }
  });

  it("lets only free cards lift on hover", () => {
    const liftable = surface.shapes.filter((shape) => surface.canLift(shape));
    expect(liftable.length).toBeGreaterThan(0);
    for (const shape of liftable) {
      expect(shape.pins).toEqual(["top"]);
      for (const { points } of surface.runs) {
        for (const point of points) {
          if (distanceOutside(shape.item, [point.x, point.y]) > 0) continue;
          expect(toLocal(shape.item, [point.x, point.y])[1]).toBeGreaterThan(pinOffsetOf(shape.item)[1] - 0.1);
        }
      }
    }
  });
});
