"use client";

import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { useMemo } from "react";
import { Vector2 } from "three";
import type { Quality } from "../quality";

export function Effects({ quality }: { quality: Quality }) {
  const aberration = useMemo(() => new Vector2(0.0007, 0.0005), []);
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
      <Vignette offset={0.18} darkness={0.82} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.55} />
    </EffectComposer>
  );
}
