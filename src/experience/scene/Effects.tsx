"use client";

import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { useMemo } from "react";
import { Vector2 } from "three";
import type { Quality } from "../quality";
import type { Palette } from "../state/variant";
import { LOOKS } from "./look";

export function Effects({ quality, palette }: { quality: Quality; palette: Palette }) {
  const aberration = useMemo(() => new Vector2(0.0007, 0.0005), []);
  const look = LOOKS[palette];
  return (
    <EffectComposer multisampling={quality.multisampling}>
      <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.75} luminanceSmoothing={0.2} />
      <ChromaticAberration
        offset={aberration}
        radialModulation
        modulationOffset={0.35}
        blendFunction={quality.chromaticAberration ? BlendFunction.NORMAL : BlendFunction.SKIP}
      />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <HueSaturation saturation={look.postSaturation} />
      <BrightnessContrast contrast={look.contrast} />
      <Vignette offset={0.18} darkness={look.vignette} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={look.grain} />
    </EffectComposer>
  );
}
