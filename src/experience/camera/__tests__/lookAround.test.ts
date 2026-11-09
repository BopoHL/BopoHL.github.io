import { MathUtils } from "three";
import { describe, expect, it } from "vitest";
import { BOARD_SIZE } from "@/content/board";
import { CAMERA_FOV } from "../framing";
import { LOOK, LookAround, boardPose, cardPose, createPose, deskPose } from "../lookAround";

const TAN_HALF = Math.tan(MathUtils.degToRad(CAMERA_FOV / 2));
const ASPECT = 16 / 9;

const boardPointUnderCursor = (u: number, distance: number) => {
  const pose = boardPose({ u, v: 0.5 }, distance, ASPECT, 0, createPose());
  return pose.target.x + (2 * u - 1) * distance * TAN_HALF * ASPECT;
};

const settle = (look: LookAround, place: "board" | "desk", seconds: number) => {
  let request = null;
  for (let t = 0; t < seconds && !request; t += 1 / 60) request = look.update(place, 1 / 60);
  return request;
};

describe("board pose", () => {
  it("puts the same spot of the board under the cursor at any zoom", () => {
    for (const u of [0.1, 0.35, 0.8]) {
      const close = boardPointUnderCursor(u, LOOK.boardDistance.min);
      const far = boardPointUnderCursor(u, 20);
      expect(close).toBeCloseTo(far, 6);
      expect(close).toBeCloseTo((2 * u - 1) * (BOARD_SIZE.width / 2 + LOOK.boardMargin), 6);
    }
  });

  it("stops panning once the whole board is in view", () => {
    const pose = boardPose({ u: 1, v: 0 }, 60, ASPECT, 0, createPose());
    expect(pose.target.x).toBe(0);
    expect(pose.target.y).toBe(0);
  });

  it("turns the camera toward the cursor", () => {
    const right = boardPose({ u: 0.9, v: 0.5 }, 17, ASPECT, 1, createPose());
    expect(right.position.x).toBeLessThan(right.target.x);
    const still = boardPose({ u: 0.9, v: 0.5 }, 17, ASPECT, 0, createPose());
    expect(still.position.x).toBeCloseTo(still.target.x, 6);
  });
});

describe("desk pose", () => {
  it("looks down at the desk and reaches further when closer", () => {
    const far = deskPose({ u: 1, v: 0.5 }, 1, ASPECT, 0, createPose());
    const close = deskPose({ u: 1, v: 0.5 }, LOOK.deskScale.min, ASPECT, 0, createPose());
    expect(far.position.y).toBeGreaterThan(far.target.y);
    expect(close.target.x).toBeGreaterThan(far.target.x);
  });
});

describe("card pose", () => {
  const bounds = { minX: -2, maxX: 2, minY: -1, maxY: 1 };

  it("frames the card in the middle when nothing covers the screen", () => {
    const pose = cardPose(bounds, ASPECT, 0, createPose());
    expect(pose.target.x).toBeCloseTo(0, 6);
    expect(pose.position.z).toBeGreaterThan(LOOK.card.closest);
  });

  it("moves the card into the uncovered part of the screen", () => {
    const pose = cardPose(bounds, ASPECT, 0.3, createPose());
    const halfWidth = pose.position.z * TAN_HALF * ASPECT;
    const cardOnScreen = (0 - pose.target.x) / halfWidth;
    expect(cardOnScreen).toBeCloseTo(-0.3, 6);
  });
});

describe("look around", () => {
  it("goes down to the desk after the cursor rests at the bottom edge", () => {
    const look = new LookAround();
    look.point(0.5, 0.97);
    expect(look.update("board", LOOK.dwell / 2)).toBeNull();
    expect(settle(look, "board", 1)).toBe("desk");
  });

  it("does not switch when the cursor only passes the edge or leaves the window", () => {
    const look = new LookAround();
    look.point(0.5, 0.97);
    look.update("board", LOOK.dwell * 0.8);
    look.point(0.5, 0.6);
    expect(settle(look, "board", 1)).toBeNull();
    look.point(0.5, 0.99);
    look.leave();
    expect(settle(look, "board", 1)).toBeNull();
  });

  it("keeps the desk until the cursor rests at the top edge", () => {
    const look = new LookAround();
    look.point(0.5, 0.97);
    expect(settle(look, "desk", 1)).toBeNull();
    look.point(0.5, 0.5);
    expect(settle(look, "desk", 1)).toBeNull();
    look.point(0.5, 0.02);
    expect(settle(look, "desk", 1)).toBe("board");
  });

  it("clamps the zoom and leaves when pushed far enough past the whole board", () => {
    const look = new LookAround();
    look.zoom(-10, "board");
    expect(look.boardDistance).toBe(LOOK.boardDistance.min);
    look.zoom(10, "board");
    expect(look.boardDistance).toBe(LOOK.boardDistance.max);
    expect(look.update("board", 1 / 60)).toBe("leave");
  });

  it("forgets a small push past the farthest zoom", () => {
    const look = new LookAround();
    look.zoom(Math.log(LOOK.boardDistance.max / LOOK.boardDistance.start) + 0.1, "board");
    expect(look.pullback()).toBeGreaterThan(1);
    expect(settle(look, "board", 3)).toBeNull();
    expect(look.pullback()).toBeCloseTo(1, 3);
  });

  it("steps back from the desk to the board when zoomed out past it", () => {
    const look = new LookAround();
    look.zoom(5, "desk");
    expect(look.update("desk", 1 / 60)).toBe("board");
  });
});
