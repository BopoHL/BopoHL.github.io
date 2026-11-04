"use client";

import { createContext, useContext, useMemo } from "react";
import { Color, MathUtils, type Texture, type WebGLProgramParametersWithUniforms } from "three";
import type { Palette } from "../state/variant";

export interface Look {
  saturation: number;
  accentSaturation: number;
  postSaturation: number;
  lampColor: string;
  lampPenumbra: number;
  hazeColor: string;
  skyColor: string;
  groundColor: string;
  ambient: number;
  keyLight: number;
  windowLight: number;
  contrast: number;
  grain: number;
  vignette: number;
}

const NOIR_BASE = {
  saturation: 0,
  lampColor: "#f3f0ea",
  lampPenumbra: 0.32,
  hazeColor: "#d9d9d9",
  skyColor: "#5a5a5a",
  groundColor: "#101010",
  ambient: 0.16,
  keyLight: 0.18,
  windowLight: 1,
  contrast: 0.24,
  grain: 0.05,
  vignette: 0.95,
};

export const LOOKS: Record<Palette, Look> = {
  warm: {
    saturation: 1,
    accentSaturation: 1,
    postSaturation: 0,
    lampColor: "#ffb46a",
    lampPenumbra: 0.85,
    hazeColor: "#ffb86b",
    skyColor: "#3c4a66",
    groundColor: "#160e08",
    ambient: 0.35,
    keyLight: 1,
    windowLight: 0,
    contrast: 0,
    grain: 0.04,
    vignette: 0.82,
  },
  noir: { ...NOIR_BASE, accentSaturation: 1, postSaturation: 0 },
  mono: { ...NOIR_BASE, accentSaturation: 0, postSaturation: -1 },
};

const DESATURATE = /* glsl */ `
uniform float uSaturation;
vec3 desaturate(vec3 color) {
  return mix(vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), color, uSaturation);
}
`;

export interface SaturationShader {
  onBeforeCompile: (shader: WebGLProgramParametersWithUniforms) => void;
  customProgramCacheKey: () => string;
}

const PAPER_LOD_BIAS = -0.6;

const SHARP_MAP = /* glsl */ `
#ifdef USE_MAP
  diffuseColor *= texture2D(map, vMapUv, ${PAPER_LOD_BIAS.toFixed(2)});
#endif
`;

export const saturationShader = (uniform: { value: number }, sharpMap = false): SaturationShader => ({
  onBeforeCompile: (shader) => {
    shader.uniforms.uSaturation = uniform;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${DESATURATE}`)
      .replace(
        "#include <map_fragment>",
        `${sharpMap ? SHARP_MAP : "#include <map_fragment>"}\ndiffuseColor.rgb = desaturate(diffuseColor.rgb);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance = desaturate(totalEmissiveRadiance);",
      );
  },
  customProgramCacheKey: () => (sharpMap ? "desaturate-sharp" : "desaturate"),
});

const INKED = /* glsl */ `
uniform float uSaturation;
uniform float uAccentSaturation;
uniform sampler2D uAccentMask;
vec3 desaturateTo(vec3 color, float amount) {
  return mix(vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), color, amount);
}
`;

const inkedShader = (world: { value: number }, accent: { value: number }, mask: Texture): SaturationShader => ({
  onBeforeCompile: (shader) => {
    shader.uniforms.uSaturation = world;
    shader.uniforms.uAccentSaturation = accent;
    shader.uniforms.uAccentMask = { value: mask };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${INKED}`)
      .replace(
        "#include <map_fragment>",
        `${SHARP_MAP}
        float inked = texture2D(uAccentMask, vMapUv).r;
        diffuseColor.rgb = desaturateTo(diffuseColor.rgb, mix(uSaturation, uAccentSaturation, inked));`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance = desaturateTo(totalEmissiveRadiance, uSaturation);",
      );
  },
  customProgramCacheKey: () => "desaturate-inked",
});

const BLEND_SPEED = 3;

export class LookState {
  readonly saturation: { value: number };
  readonly accentSaturation: { value: number };
  readonly worldShader: SaturationShader;
  readonly accentShader: SaturationShader;
  readonly paperShader: SaturationShader;
  readonly lampColor: Color;
  readonly hazeColor: Color;
  readonly skyColor: Color;
  readonly groundColor: Color;
  private readonly targetLamp = new Color();
  private readonly targetHaze = new Color();
  private readonly targetSky = new Color();
  private readonly targetGround = new Color();
  private penumbraValue: number;
  private ambientValue: number;
  private keyLightValue: number;
  private windowLightValue: number;
  private target: Look;

  constructor(initial: Look) {
    this.saturation = { value: initial.saturation };
    this.accentSaturation = { value: initial.accentSaturation };
    this.worldShader = saturationShader(this.saturation);
    this.accentShader = saturationShader(this.accentSaturation);
    this.paperShader = saturationShader(this.saturation, true);
    this.lampColor = new Color(initial.lampColor);
    this.hazeColor = new Color(initial.hazeColor);
    this.skyColor = new Color(initial.skyColor);
    this.groundColor = new Color(initial.groundColor);
    this.penumbraValue = initial.lampPenumbra;
    this.ambientValue = initial.ambient;
    this.keyLightValue = initial.keyLight;
    this.windowLightValue = initial.windowLight;
    this.target = initial;
    this.setTarget(initial);
  }

  get penumbra() {
    return this.penumbraValue;
  }

  get ambient() {
    return this.ambientValue;
  }

  get keyLight() {
    return this.keyLightValue;
  }

  get windowLight() {
    return this.windowLightValue;
  }

  inkedShader(mask: Texture): SaturationShader {
    return inkedShader(this.saturation, this.accentSaturation, mask);
  }

  setTarget(look: Look) {
    this.target = look;
    this.targetLamp.set(look.lampColor);
    this.targetHaze.set(look.hazeColor);
    this.targetSky.set(look.skyColor);
    this.targetGround.set(look.groundColor);
  }

  update(delta: number) {
    const k = 1 - Math.exp(-delta * BLEND_SPEED);
    this.saturation.value = MathUtils.lerp(this.saturation.value, this.target.saturation, k);
    this.accentSaturation.value = MathUtils.lerp(this.accentSaturation.value, this.target.accentSaturation, k);
    this.penumbraValue = MathUtils.lerp(this.penumbraValue, this.target.lampPenumbra, k);
    this.ambientValue = MathUtils.lerp(this.ambientValue, this.target.ambient, k);
    this.keyLightValue = MathUtils.lerp(this.keyLightValue, this.target.keyLight, k);
    this.windowLightValue = MathUtils.lerp(this.windowLightValue, this.target.windowLight, k);
    this.lampColor.lerp(this.targetLamp, k);
    this.hazeColor.lerp(this.targetHaze, k);
    this.skyColor.lerp(this.targetSky, k);
    this.groundColor.lerp(this.targetGround, k);
  }
}

export const LookContext = createContext<LookState | null>(null);

export const useLook = (): LookState => {
  const look = useContext(LookContext);
  if (!look) throw new Error("useLook must be used inside LookContext");
  return look;
};

export const useWorldShader = () => {
  const look = useLook();
  return look.worldShader;
};

export const useAccentShader = () => {
  const look = useLook();
  return look.accentShader;
};

export const usePaperShader = (accentMask?: Texture) => {
  const look = useLook();
  return useMemo(() => (accentMask ? look.inkedShader(accentMask) : look.paperShader), [look, accentMask]);
};
