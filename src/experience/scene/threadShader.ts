import type { WebGLProgramParametersWithUniforms } from "three";
import type { SaturationShader } from "./look";

export const THREAD_RADIUS = 0.0045;
const MIN_SCREEN_RADIUS_PX = 0.55;
const TWISTS_PER_UNIT = 38;
const STRANDS = 3;

const VERTEX_HEAD = /* glsl */ `
uniform float uRadius;
uniform float uPixelAngle;
varying vec2 vThreadUv;
`;

const VERTEX_BODY = /* glsl */ `
vec3 threadCenter = position - normal * uRadius;
float cameraDistance = distance((modelMatrix * vec4(threadCenter, 1.0)).xyz, cameraPosition);
float threadRadius = max(uRadius, ${MIN_SCREEN_RADIUS_PX.toFixed(2)} * uPixelAngle * cameraDistance);
vec3 transformed = threadCenter + normal * threadRadius;
vThreadUv = uv;
`;

const FRAGMENT_HEAD = /* glsl */ `
uniform float uLength;
varying vec2 vThreadUv;
`;

const FRAGMENT_BODY = /* glsl */ `
float twistPhase = vThreadUv.x * uLength * ${TWISTS_PER_UNIT.toFixed(1)} - vThreadUv.y * ${STRANDS.toFixed(1)};
float strand = fract(twistPhase);
float groove = smoothstep(0.0, 0.18, strand) * smoothstep(1.0, 0.7, strand);
float aliasing = clamp(fwidth(twistPhase) * 1.5 - 0.5, 0.0, 1.0);
diffuseColor.rgb *= mix(mix(0.62, 1.0, groove), 0.85, aliasing);
`;

const pixelAngle = (fovDegrees: number, viewportHeight: number) =>
  (2 * Math.tan((fovDegrees * Math.PI) / 360)) / Math.max(1, viewportHeight);

export class ThreadShader {
  private readonly uniforms = {
    uRadius: { value: THREAD_RADIUS },
    uPixelAngle: { value: 0.001 },
    uLength: { value: 1 },
  };

  constructor(
    private readonly accent: SaturationShader,
    length: number,
  ) {
    this.uniforms.uLength.value = length;
  }

  readonly onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    this.accent.onBeforeCompile(shader);
    Object.assign(shader.uniforms, this.uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_HEAD}`)
      .replace("#include <begin_vertex>", VERTEX_BODY);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_HEAD}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${FRAGMENT_BODY}`);
  };

  readonly customProgramCacheKey = () => `${this.accent.customProgramCacheKey()}-thread`;

  updateView(fovDegrees: number, viewportHeight: number) {
    this.uniforms.uPixelAngle.value = pixelAngle(fovDegrees, viewportHeight);
  }
}
