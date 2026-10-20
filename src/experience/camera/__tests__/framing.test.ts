import { describe, expect, it } from "vitest";
import { boardContentFor } from "@/content/selectors";
import { boundsOf, unionBounds } from "@/content/geometry";
import { blendAt, buildShots, fitsInView, type FramingOptions } from "../framing";

const options = (aspect: number): FramingOptions => ({
  aspect,
  fovDegrees: 35,
  padding: 1.1,
  safeTop: 0.08,
  safeBottom: 0.16,
});

describe("buildShots", () => {
  const { stations, evidence } = boardContentFor("reveal");

  it("creates one shot per station on landscape screens", () => {
    const shots = buildShots(stations, evidence, options(16 / 9));
    expect(shots).toHaveLength(stations.length);
    expect(shots.map((shot) => shot.stationIndex)).toEqual(stations.map((_, index) => index));
  });

  it("splits busy stations into closer shots on portrait screens", () => {
    const landscape = buildShots(stations, evidence, options(16 / 9));
    const portrait = buildShots(stations, evidence, options(9 / 19.5));
    expect(portrait.length).toBeGreaterThan(landscape.length);
    expect(portrait.at(-1)?.stationIndex).toBe(stations.length - 1);
  });

  it("keeps the focused evidence inside the frame for angled cameras", () => {
    const landscape = options(16 / 9);
    const byId = new Map(evidence.map((item) => [item.id, item]));
    const shots = buildShots(stations, evidence, landscape);
    stations.forEach((station, index) => {
      if (station.focus === "all") return;
      const bounds = unionBounds(station.focus.map((id) => boundsOf(byId.get(id)!)));
      expect(fitsInView(bounds, shots[index].position, shots[index].target, landscape)).toBe(true);
    });
  });

  it("places every camera in front of the board", () => {
    for (const shot of buildShots(stations, evidence, options(9 / 19.5))) {
      expect(shot.position[2]).toBeGreaterThan(shot.target[2]);
    }
  });
});

describe("blendAt", () => {
  it("holds on a shot before moving to the next one", () => {
    expect(blendAt(2.2, 5, 0.3)).toMatchObject({ from: 2, to: 3, amount: 0, nearest: 2 });
  });

  it("finishes the move at the next integer", () => {
    expect(blendAt(2.999, 5, 0.3).amount).toBeGreaterThan(0.99);
  });

  it("clamps to the last shot", () => {
    expect(blendAt(10, 5, 0.3)).toMatchObject({ from: 3, to: 4, amount: 1, nearest: 4 });
  });
});
