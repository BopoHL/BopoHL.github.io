import { describe, expect, it } from "vitest";
import { boardContentFor } from "@/content/selectors";
import { buildShots, framingFor } from "../framing";
import { CINEMA_MOTION } from "../motion";
import { createPose, RouteTrack } from "../routeTrack";

const { stations, evidence } = boardContentFor("reveal");
const shots = buildShots(stations, evidence, framingFor(16 / 9, "cinema"), "cinema");
const track = new RouteTrack(shots, CINEMA_MOTION);

const largestJump = (haste: number, step: number) => {
  const previous = createPose();
  const current = createPose();
  track.poseAt(0, haste, previous);
  let largest = 0;
  for (let progress = step; progress <= shots.length - 1; progress += step) {
    track.poseAt(progress, haste, current);
    largest = Math.max(largest, current.position.distanceTo(previous.position));
    previous.position.copy(current.position);
  }
  return largest;
};

describe("RouteTrack", () => {
  it("holds on a shot while the scroll rests near it", () => {
    const pose = track.poseAt(2.1, 0, createPose());
    expect(pose.position.toArray()).toEqual(shots[2].position.map((value) => expect.closeTo(value, 6)));
    expect(pose.nearest).toBe(2);
  });

  it("glides between shots without pushing in or pulling out", () => {
    const pose = createPose();
    for (let progress = 0; progress < shots.length - 1; progress += 0.01) {
      const from = shots[Math.floor(progress)];
      const to = shots[Math.min(Math.floor(progress) + 1, shots.length - 1)];
      track.poseAt(progress, 0, pose);
      expect(pose.position.z).toBeLessThanOrEqual(Math.max(from.position[2], to.position[2]) + 1e-9);
      expect(pose.position.z).toBeGreaterThanOrEqual(Math.min(from.position[2], to.position[2]) - 1e-9);
    }
  });

  it("levels the horizon while travelling fast", () => {
    expect(track.poseAt(3, 1, createPose()).roll).toBe(0);
  });

  it.each([0, 0.5, 1])("moves continuously along the whole route at haste %s", (haste) => {
    expect(largestJump(haste, 0.0005)).toBeLessThan(largestJump(haste, 0.002) * 0.35);
  });
});
