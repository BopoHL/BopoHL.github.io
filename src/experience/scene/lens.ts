import { DepthOfFieldEffect, MaskFunction } from "postprocessing";
import { MathUtils, Vector3, type Camera } from "three";
import type { FocusBlur } from "../quality";
import { PeripheralBlurEffect } from "./peripheralBlur";

const FOCUS = { minRange: 2, rangePerDistance: 0.3 };
const FADE_SPEED = 4;
const CLOSED = 1e-3;

export class Lens {
  readonly focus: DepthOfFieldEffect;
  readonly peripheral: PeripheralBlurEffect;
  private strength = 1;

  constructor(
    private readonly camera: Camera,
    private readonly blur: FocusBlur,
  ) {
    this.focus = new DepthOfFieldEffect(camera, {
      focusRange: FOCUS.minRange,
      bokehScale: blur.bokehScale,
      resolutionScale: blur.resolutionScale,
    });
    this.focus.target = new Vector3();
    this.focus.maskFunction = MaskFunction.MULTIPLY_RGB_SET_ALPHA;
    this.peripheral = new PeripheralBlurEffect({ radius: blur.peripheralRadius });
  }

  update(target: Vector3, reading: boolean, delta: number) {
    this.strength = MathUtils.damp(this.strength, reading ? 0 : 1, FADE_SPEED, delta);
    const distance = this.camera.position.distanceTo(target);
    this.focus.target?.copy(target);
    this.focus.cocMaterial.focusRange = Math.max(FOCUS.minRange, distance * FOCUS.rangePerDistance) / Math.max(this.strength, CLOSED);
    this.focus.bokehScale = this.blur.bokehScale * this.strength;
    this.peripheral.setRadius(this.blur.peripheralRadius * this.strength);
  }

  dispose() {
    this.focus.dispose();
    this.peripheral.dispose();
  }
}
