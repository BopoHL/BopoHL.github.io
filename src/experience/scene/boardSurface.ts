import { Vector3 } from "three";
import { distanceOutside, pinOffsetOf, toLocal } from "@/content/geometry";
import { pinBoard, type AnchoredThread } from "@/content/pinning";
import type { Evidence, Thread, Vec2 } from "@/content/types";
import { cardShapesFor, localHeight, type CardShape } from "./cardGeometry";
import { cardZ, pinWorld } from "./layout3d";
import { threadPath } from "./threadPath";
import { THREAD_RADIUS } from "./threadShader";

const THREAD_DRAPE = { radius: THREAD_RADIUS, clearance: 0.0025, sagPerUnit: 0.035, maxSag: 0.6, samplesPerUnit: 24 };
const HINGE_MARGIN = 0.1;

export interface ThreadRun {
  thread: AnchoredThread;
  points: Vector3[];
}

export class BoardSurface {
  readonly shapes: CardShape[];
  readonly runs: ThreadRun[];
  private readonly byId: Map<string, CardShape>;
  private readonly carriers: Set<string>;

  constructor(evidence: Evidence[], threads: Thread[]) {
    const pinning = pinBoard(evidence, threads);
    this.shapes = cardShapesFor(evidence, pinning.spots);
    this.byId = new Map(this.shapes.map((shape) => [shape.item.id, shape]));
    this.runs = pinning.threads.map((thread) => ({ thread, points: this.threadPoints(thread) }));
    this.carriers = this.findCarriers();
  }

  canLift(shape: CardShape): boolean {
    return shape.pins.length === 1 && !this.carriers.has(shape.item.id);
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

  private findCarriers(): Set<string> {
    const carriers = new Set<string>();
    for (const { points } of this.runs) {
      for (const point of points) {
        for (const shape of this.shapes) {
          if (carriers.has(shape.item.id) || distanceOutside(shape.item, [point.x, point.y]) > 0) continue;
          const [, y] = toLocal(shape.item, [point.x, point.y]);
          if (y < pinOffsetOf(shape.item)[1] - HINGE_MARGIN) carriers.add(shape.item.id);
        }
      }
    }
    return carriers;
  }

  private threadPoints(thread: AnchoredThread): Vector3[] {
    const from = this.shapeOf(thread.from);
    const to = this.shapeOf(thread.to);
    return threadPath(
      this,
      new Vector3(...pinWorld(from.item, from.index, thread.fromSpot)),
      new Vector3(...pinWorld(to.item, to.index, thread.toSpot)),
      THREAD_DRAPE,
    );
  }
}
