import { Vector3 } from "three";
import { distanceOutside, pinOf, pinOffsetOf, toLocal, type PinSpot } from "@/content/geometry";
import { pinBoard, type AnchoredThread } from "@/content/pinning";
import type { Evidence, Thread, Vec2 } from "@/content/types";
import { range, seededRandom } from "@/lib/random";
import type { PinStyle } from "../state/variant";
import { cardShapesFor, localHeight, type CardShape } from "./cardGeometry";
import { cardZ, pinAxis } from "./layout3d";
import { PIN_WRAP } from "./pinModel";
import { hangingTail, threadPath, winding, type PinPost, type WindingOptions } from "./threadPath";
import { THREAD_RADIUS } from "./threadShader";

const THREAD_DRAPE = { radius: THREAD_RADIUS, clearance: 0.0025, sagPerUnit: 0.035, maxSag: 0.6, samplesPerUnit: 24 };
const HINGE_MARGIN = 0.1;
const WINDING = { turns: 2.5, pitch: THREAD_RADIUS * 2.05, pointsPerTurn: 18 };
const LAYER = { rise: THREAD_RADIUS * 1.1, grow: THREAD_RADIUS * 1.7 };
const TAIL = {
  chance: 0.75,
  length: [0.1, 0.22] as const,
  spread: 0.6,
  sway: 0.05,
  reach: 0.06,
  lift: THREAD_RADIUS + 0.0015,
  fall: 0.05,
  samples: 12,
};
const HEAD_CLEARANCE: Record<PinStyle, number> = { push: 0.09, map: 0.02 };

interface Wrap {
  post: PinPost;
  options: WindingOptions;
}

export interface ThreadRun {
  thread: AnchoredThread;
  points: Vector3[];
}

export class BoardSurface {
  readonly shapes: CardShape[];
  readonly runs: ThreadRun[];
  private readonly byId: Map<string, CardShape>;
  private readonly carriers: Set<string>;
  private readonly windings = new Map<string, number>();

  constructor(
    evidence: Evidence[],
    threads: Thread[],
    private readonly pinStyle: PinStyle = "push",
  ) {
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

  private wrap(shape: CardShape, spot: PinSpot): Wrap {
    const key = `${shape.item.id}:${spot}`;
    const layer = this.windings.get(key) ?? 0;
    this.windings.set(key, layer + 1);
    const { radius, base } = PIN_WRAP[this.pinStyle];
    const axis = pinAxis(shape.item, spot);
    const [x, y] = pinOf(shape.item, spot);
    const origin = new Vector3(x, y, cardZ(shape.index)).addScaledVector(axis, base + (layer % 2) * LAYER.rise);
    return {
      post: { base: origin, axis },
      options: { ...WINDING, radius: radius + THREAD_RADIUS + layer * LAYER.grow },
    };
  }

  private threadPoints(thread: AnchoredThread): Vector3[] {
    const random = seededRandom(`${thread.from}->${thread.to}-tail`);
    const tailed = random() < TAIL.chance;
    const from = this.wrap(this.shapeOf(thread.from), thread.fromSpot);
    const to = this.wrap(this.shapeOf(thread.to), thread.toSpot);
    const hangsFrom = -Math.PI / 2 + (random() * 2 - 1) * TAIL.spread;
    const start = winding(from.post, to.post.base, from.options);
    const end = winding(to.post, from.post.base, tailed ? { ...to.options, startAngle: hangsFrom } : to.options).reverse();
    const run = threadPath(this, start[start.length - 1], end[0], THREAD_DRAPE);
    const points = [...start, ...run.slice(1, -1), ...end];
    if (!tailed) return points;
    const tail = hangingTail(this, end[end.length - 1], pinOf(this.shapeOf(thread.to).item, thread.toSpot), {
      length: range(random, ...TAIL.length),
      sway: (random() * 2 - 1) * TAIL.sway,
      reach: TAIL.reach,
      lift: TAIL.lift,
      clearance: HEAD_CLEARANCE[this.pinStyle],
      fall: TAIL.fall,
      samples: TAIL.samples,
    });
    return [...points, ...tail.slice(1)];
  }
}
