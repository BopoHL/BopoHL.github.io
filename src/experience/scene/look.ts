"use client";

import { createContext, useContext } from "react";
import { Color, MathUtils, type WebGLProgramParametersWithUniforms } from "three";
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
  blinds: boolean;
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
  blinds: true,
  contrast: 0.24,
  grain: 0.5,
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
    blinds: false,
    contrast: 0,
    grain: 0.55,
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

export const saturationShader = (uniform: { value: number }): SaturationShader => ({
  onBeforeCompile: (shader) => {
    shader.uniforms.uSaturation = uniform;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${DESATURATE}`)
      .replace("#include <map_fragment>", "#include <map_fragment>\ndiffuseColor.rgb = desaturate(diffuseColor.rgb);")
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ntotalEmissiveRadiance = desaturate(totalEmissiveRadiance);",
      );
  },
  customProgramCacheKey: () => "desaturate",
});

const BLEND_SPEED = 3;

export class LookState {
  readonly saturation = { value: 1 };
  readonly accentSaturation = { value: 1 };
  readonly worldShader = saturationShader(this.saturation);
  readonly accentShader = saturationShader(this.accentSaturation);
  readonly lampColor = new Color(LOOKS.warm.lampColor);
  readonly hazeColor = new Color(LOOKS.warm.hazeColor);
  readonly skyColor = new Color(LOOKS.warm.skyColor);
  readonly groundColor = new Color(LOOKS.warm.groundColor);
  private readonly targetLamp = new Color();
  private readonly targetHaze = new Color();
  private readonly targetSky = new Color();
  private readonly targetGround = new Color();
  private penumbraValue = LOOKS.warm.lampPenumbra;
  private ambientValue = LOOKS.warm.ambient;
  private target: Look = LOOKS.warm;

  get penumbra() {
    return this.penumbraValue;
  }

  get ambient() {
    return this.ambientValue;
  }

  get blinds() {
    return this.target.blinds;
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
