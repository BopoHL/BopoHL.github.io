import { Box3, PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { InView } from "../inView";

describe("InView", () => {
  const desk = new InView(new Box3(new Vector3(-12, -21, 0), new Vector3(12, -6, 9)));
  const camera = new PerspectiveCamera(40, 16 / 9, 0.1, 200);

  it("sees the desk when the camera looks down at it", () => {
    camera.position.set(0, 3, 30);
    camera.lookAt(0, -10, 4);
    expect(desk.seenBy(camera)).toBe(true);
  });

  it("does not see the desk from close up on the board", () => {
    camera.position.set(4, 6, 8);
    camera.lookAt(4, 6, 0);
    expect(desk.seenBy(camera)).toBe(false);
  });
});
