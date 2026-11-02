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

const fling = (from: number, to: number, seconds: number, traveling = false) => {
  const follower = followerAt(from);
  const frames: Array<{ speed: number; nearest: number }> = [];
  let previous = follower.position.clone();
  for (let frame = 0; frame < seconds / FRAME; frame++) {
    follower.update(to, FRAME, still, traveling);
    frames.push({ speed: follower.position.distanceTo(previous) / FRAME, nearest: follower.nearest });
    previous = follower.position.clone();
  }
  return { follower, frames };
};

const lastInvestigationShot = shots.findIndex((shot) => stations[shot.stationIndex].focus === "all") - 1;
const level = shots[1].position[2] - shots[1].target[2];
const maxCalmSpeed = CINEMA_MOTION.browse.heightsPerSecond * level * 1.3;

describe("RouteFollower", () => {
  it("pans calmly even when the scroll is flung across the board", () => {
    const { frames } = fling(0, lastInvestigationShot, 90);
    expect(Math.max(...frames.map((frame) => frame.speed))).toBeLessThan(maxCalmSpeed);
  });

  it("pauses at every stop on the way", () => {
    const { frames } = fling(0, lastInvestigationShot, 90);
    for (let shot = 1; shot < lastInvestigationShot; shot++) {
      const resting = frames.filter((frame) => frame.nearest === shot && frame.speed < 0.05).length * FRAME;
      expect(resting).toBeGreaterThan(CINEMA_MOTION.dwell * 0.8);
    }
  });

  it("travels faster when the visitor jumps to a chapter", () => {
    const calm = fling(0, lastInvestigationShot, 90).frames.findIndex((frame) => frame.nearest === lastInvestigationShot);
    const travel = fling(0, lastInvestigationShot, 90, true).frames.findIndex(
      (frame) => frame.nearest === lastInvestigationShot,
    );
    expect(travel).toBeLessThan(calm / 2);
  });

  it("arrives at the requested shot", () => {
    const { follower } = fling(0, 6, 30);
    expect(follower.nearest).toBe(6);
    expect(follower.position.distanceTo(new Vector3(...shots[6].position))).toBeLessThan(0.01);
  });
});
