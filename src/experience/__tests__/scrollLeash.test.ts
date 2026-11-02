import { describe, expect, it } from "vitest";
import { leashed } from "../scrollLeash";

describe("leashed", () => {
  it("lets the scroll move freely before the camera starts following", () => {
    expect(leashed(12, null, 1.25)).toBe(12);
  });

  it("keeps the scroll within reach of what the camera has shown", () => {
    expect(leashed(9, 3, 1.25)).toBe(4.25);
    expect(leashed(0, 3, 1.25)).toBe(1.75);
    expect(leashed(3.5, 3, 1.25)).toBe(3.5);
  });
});
