import { BlendFunction, Effect } from "postprocessing";
import { Uniform, type WebGLRenderer, type WebGLRenderTarget } from "three";

const fragmentShader = /* glsl */ `
uniform float uIntensity;
uniform float uFrame;
uniform float uSize;

float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 cell = floor(uv * resolution / uSize);
  float noise = grainHash(cell + uFrame * 37.0) + grainHash(cell * 1.7 - uFrame * 11.0) - 1.0;
  float luma = dot(inputColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float midtones = 4.0 * luma * (1.0 - luma);
  outputColor = vec4(inputColor.rgb + noise * uIntensity * midtones, inputColor.a);
}
`;

const FRAME_RATE = 24;

export class FilmGrainEffect extends Effect {
  private elapsed = 0;

  constructor(intensity: number, size = 1.6) {
    super("FilmGrainEffect", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([
        ["uIntensity", new Uniform(intensity)],
        ["uFrame", new Uniform(0)],
        ["uSize", new Uniform(size)],
      ]),
    });
  }

  override update(_renderer: WebGLRenderer, _inputBuffer: WebGLRenderTarget, deltaTime = 0) {
    this.elapsed += deltaTime;
    const frame = this.uniforms.get("uFrame");
    if (frame) frame.value = Math.floor(this.elapsed * FRAME_RATE) % 1000;
  }
}
