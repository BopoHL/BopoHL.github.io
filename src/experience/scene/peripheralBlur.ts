import { BlendFunction, Effect, EffectAttribute } from "postprocessing";
import { Uniform, Vector2 } from "three";

const TAPS = 12;

const fragmentShader = /* glsl */ `
uniform vec2 uFocus;
uniform float uInner;
uniform float uOuter;
uniform float uRadius;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 offset = (uv - uFocus) * vec2(aspect, 1.0);
  float amount = smoothstep(uInner, uOuter, length(offset));
  if (amount < 0.01) {
    outputColor = inputColor;
    return;
  }
  float radius = amount * uRadius * resolution.y / 1000.0;
  vec4 sum = inputColor;
  for (int i = 0; i < ${TAPS}; i++) {
    float t = (float(i) + 0.5) / ${TAPS}.0;
    float angle = float(i) * 2.39996323;
    vec2 tap = vec2(cos(angle), sin(angle)) * sqrt(t) * radius * texelSize;
    sum += texture2D(inputBuffer, uv + tap);
  }
  outputColor = sum / ${TAPS + 1}.0;
}
`;

export interface PeripheralBlurOptions {
  focus?: Vector2;
  inner?: number;
  outer?: number;
  radius: number;
}

export class PeripheralBlurEffect extends Effect {
  constructor({ focus = new Vector2(0.5, 0.54), inner = 0.5, outer = 1.05, radius }: PeripheralBlurOptions) {
    super("PeripheralBlurEffect", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ["uFocus", new Uniform(focus)],
        ["uInner", new Uniform(inner)],
        ["uOuter", new Uniform(outer)],
        ["uRadius", new Uniform(radius)],
      ]),
    });
  }

  setRadius(radius: number) {
    const uniform = this.uniforms.get("uRadius");
    if (uniform) uniform.value = radius;
  }
}
