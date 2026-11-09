import { DepthOfFieldEffect } from "postprocessing";
import { PerspectiveCamera, Vector3, type WebGLRenderer, type WebGLRenderTarget } from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Lens } from "../lens";

const BLUR = { resolutionScale: 0.5, bokehScale: 2.4, peripheralRadius: 5 };
const renderer = {} as WebGLRenderer;
const input = {} as WebGLRenderTarget;

describe("Lens", () => {
  afterEach(() => vi.restoreAllMocks());

  it("stops rendering the depth of field once the visitor has been exploring a while", () => {
    const blurPasses = vi.spyOn(DepthOfFieldEffect.prototype, "update").mockImplementation(() => {});
    const lens = new Lens(new PerspectiveCamera(), BLUR);
    const target = new Vector3(0, 0, -10);

    lens.update(target, true, 1 / 60);
    lens.focus.update(renderer, input, 1 / 60);
    expect(blurPasses).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 180; i++) lens.update(target, true, 1 / 60);
    lens.focus.update(renderer, input, 1 / 60);
    expect(blurPasses).toHaveBeenCalledTimes(1);

    lens.update(target, false, 1 / 60);
    lens.focus.update(renderer, input, 1 / 60);
    expect(blurPasses).toHaveBeenCalledTimes(2);
    lens.dispose();
  });
});
