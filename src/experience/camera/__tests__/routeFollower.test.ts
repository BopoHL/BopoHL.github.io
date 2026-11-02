import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { boardContentFor } from "@/content/selectors";
import { buildShots, framingFor } from "../framing";
import { CINEMA_MOTION } from "../motion";
import { RouteFollower } from "../routeFollower";
import { RouteTrack } from "../routeTrack";

const { stations, evidence } = boardContentFor("reveal");
const shots = buildShots(stations, evidence, framingFor(16 / 9, "cinema"), "cinema");
const still = { x: 0, y: 0 };
const FRAME = 1 / 60;

const followerAt = (progress: number) => {
  const follower = new RouteFollower(new RouteTrack(shots, CINEMA_MOTION), CINEMA_MOTION);
  const start = shots[progress];
  follower.reset(progress, new Vector3(...start.position), new Vector3(...start.target));
  return follower;
};

const fling = (from: number, to: number, seconds: number) => {
  const follower = followerAt(from);
  const velocities: Vector3[] = [];
  let previous = follower.position.clone();
  for (let frame = 0; frame < seconds / FRAME; frame++) {
    follower.update(to, FRAME, still);
    velocities.push(follower.position.clone().sub(previous).divideScalar(FRAME));
    previous = follower.position.clone();
  }
  return { follower, velocities };
};

describe("RouteFollower", () => {
  it("glides instead of jumping when the scroll is flung across the board", () => {
    const { velocities } = fling(0, 20, 12);
    const jerks = velocities.slice(1).map((velocity, i) => velocity.distanceTo(velocities[i]) / FRAME);
    expect(Math.max(...velocities.map((velocity) => velocity.length()))).toBeLessThan(40);
    expect(Math.max(...jerks)).toBeLessThan(400);
  });

  it("limits how fast the story advances", () => {
    const follower = followerAt(0);
    for (let frame = 0; frame < 60; frame++) follower.update(20, FRAME, still);
    expect(follower.progress).toBeLessThanOrEqual(CINEMA_MOTION.maxShotsPerSecond + 0.01);
  });

  it("arrives at the requested shot", () => {
    const { follower } = fling(0, 6, 12);
    expect(follower.nearest).toBe(6);
    expect(follower.position.distanceTo(new Vector3(...shots[6].position))).toBeLessThan(0.01);
  });
});
