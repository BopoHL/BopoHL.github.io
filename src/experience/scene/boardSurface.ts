import { Vector3 } from "three";
import { distanceOutside, toLocal } from "@/content/geometry";
import type { Evidence, Vec2 } from "@/content/types";
import { cardShapesFor, localHeight, type CardShape } from "./cardGeometry";
import { cardZ, pinWorld } from "./layout3d";
import { threadPath } from "./threadPath";
import { THREAD_RADIUS } from "./threadShader";

const THREAD_DRAPE = { radius: THREAD_RADIUS, clearance: 0.0025, sagPerUnit: 0.035, maxSag: 0.6, samplesPerUnit: 24 };

export class BoardSurface {
  readonly shapes: CardShape[];
  private readonly byId: Map<string, CardShape>;

  constructor(evidence: Evidence[]) {
    this.shapes = cardShapesFor(evidence);
    this.byId = new Map(this.shapes.map((shape) => [shape.item.id, shape]));
  }

  shapeOf(id: string): CardShape {
    const shape = this.byId.get(id);
    if (!shape) throw new Error(`Unknown evidence ${id}`);
    return shape;
  }

  heightAt(point: Vec2): number {
    let top = 0;
    for (const shape of this.shapes) {
      if (distanceOutside(shape.item, point) > 0) continue;
      const [x, y] = toLocal(shape.item, point);
      top = Math.max(top, cardZ(shape.index) + localHeight(shape, x, y));
    }
    return top;
  }

  threadBetween(fromId: string, toId: string): Vector3[] {
    const from = this.shapeOf(fromId);
    const to = this.shapeOf(toId);
    return threadPath(
      this,
      new Vector3(...pinWorld(from.item, from.index)),
      new Vector3(...pinWorld(to.item, to.index)),
      THREAD_DRAPE,
    );
  }
}
