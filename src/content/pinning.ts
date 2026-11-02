import { pinOf, type PinSpot } from "./geometry";
import type { Evidence, Thread } from "./types";

const SPOTS: readonly PinSpot[] = ["top", "bottom"];

export interface AnchoredThread extends Thread {
  fromSpot: PinSpot;
  toSpot: PinSpot;
}

export interface Pinning {
  threads: AnchoredThread[];
  spots: Map<string, PinSpot[]>;
}

const closestSpots = (from: Evidence, to: Evidence): [PinSpot, PinSpot] => {
  let best: [PinSpot, PinSpot] = ["top", "top"];
  let shortest = Number.POSITIVE_INFINITY;
  for (const fromSpot of SPOTS) {
    for (const toSpot of SPOTS) {
      const [ax, ay] = pinOf(from, fromSpot);
      const [bx, by] = pinOf(to, toSpot);
      const length = Math.hypot(bx - ax, by - ay);
      if (length < shortest) {
        shortest = length;
        best = [fromSpot, toSpot];
      }
    }
  }
  return best;
};

export const pinBoard = (evidence: Evidence[], threads: Thread[]): Pinning => {
  const byId = new Map(evidence.map((item) => [item.id, item]));
  const used = new Map(evidence.map((item) => [item.id, new Set<PinSpot>(["top"])]));
  const anchored = threads.map((thread) => {
    const from = byId.get(thread.from);
    const to = byId.get(thread.to);
    if (!from || !to) throw new Error(`Thread ${thread.from} -> ${thread.to} references unknown evidence`);
    const [fromSpot, toSpot] = closestSpots(from, to);
    used.get(from.id)?.add(fromSpot);
    used.get(to.id)?.add(toSpot);
    return { ...thread, fromSpot, toSpot };
  });
  return {
    threads: anchored,
    spots: new Map([...used].map(([id, spots]) => [id, SPOTS.filter((spot) => spots.has(spot))])),
  };
};
