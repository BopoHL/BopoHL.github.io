import { describe, expect, it } from "vitest";
import { ASHTRAY, ashBedHeight, createGlassAshtray, pointAlong, restPose } from "../ashtrayModel";
import { CIGARETTE_RADIUS, createCigarette, lengthOf, startOf, type CigaretteSpec } from "../cigaretteModel";

const SPEC: CigaretteSpec = {
  seed: "test",
  sections: [
    { kind: "filter", length: 0.31 },
    { kind: "paper", length: 0.3 },
    { kind: "char", length: 0.02 },
    { kind: "ember", length: 0.02 },
    { kind: "ash", length: 0.25 },
  ],
};

describe("cigarette", () => {
  it("measures its sections", () => {
    expect(lengthOf(SPEC)).toBeCloseTo(0.9);
    expect(startOf(SPEC, "ember")).toBeCloseTo(0.63);
  });

  it("lies along +x from the filter end, as thick as a cigarette", () => {
    const geometry = createCigarette(SPEC);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.min.x).toBeCloseTo(0, 2);
    expect(box.max.x).toBeGreaterThan(0.85);
    expect(box.max.y).toBeGreaterThan(CIGARETTE_RADIUS * 0.95);
    expect(box.max.y).toBeLessThan(CIGARETTE_RADIUS * 1.25);
  });
});

describe("glass ashtray", () => {
  const rimHeight = (angle: number) => {
    const position = createGlassAshtray().getAttribute("position");
    let top = 0;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const offset = Math.abs(Math.atan2(Math.sin(Math.atan2(x, z) - angle), Math.cos(Math.atan2(x, z) - angle)));
      if (Math.hypot(x, z) > 0.85 && offset < 0.01) top = Math.max(top, position.getY(i));
    }
    return top;
  };

  it("cuts a rest for a cigarette into the rim", () => {
    const [notch] = ASHTRAY.notch.angles;
    expect(rimHeight(notch)).toBeLessThan(ASHTRAY.rimTop - ASHTRAY.notch.depth * 0.9);
    expect(rimHeight(notch + Math.PI / 3)).toBeCloseTo(ASHTRAY.rimTop, 2);
  });

  it("keeps the ash above the glass floor", () => {
    for (const [x, z] of [[0, 0], [0.3, 0.1], [-0.5, 0.2]]) expect(ashBedHeight(x, z, 1)).toBeGreaterThan(ASHTRAY.floor);
  });

  it("rests the cigarette in the notch, tip down over the bowl", () => {
    const pose = restPose();
    const contact = pointAlong(pose, pose.contact);
    expect(contact.distanceTo(pose.position)).toBeCloseTo(0);
    expect(Math.hypot(contact.x, contact.z)).toBeCloseTo(ASHTRAY.rest.radius);
    const tip = pointAlong(pose, lengthOf(SPEC));
    expect(Math.hypot(tip.x, tip.z)).toBeLessThan(ASHTRAY.rest.radius);
    expect(tip.y).toBeLessThan(contact.y);
  });
});
