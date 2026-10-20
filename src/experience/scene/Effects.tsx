"use client";

import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  HueSaturation,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { useFrame } from "@react-three/fiber";
import { BlendFunction, ToneMappingMode, type DepthOfFieldEffect } from "postprocessing";
import { useMemo, useRef } from "react";
import { Vector2 } from "three";
import { useRig } from "../camera/rig";
import type { Quality } from "../quality";
import type { Palette } from "../state/variant";
import { LOOKS } from "./look";

const FOCUS_RANGE = 1.4;
const BOKEH_SCALE = 4;

interface EffectsProps {
  quality: Quality;
  palette: Palette;
  depthOfField: boolean;
}

function FocusOnInvestigation({ effect }: { effect: React.RefObject<DepthOfFieldEffect | null> }) {
  const rig = useRig();
  useFrame(() => {
    effect.current?.target?.copy(rig.target);
  });
  return null;
}

export function Effects({ quality, palette, depthOfField }: EffectsProps) {
  const aberration = useMemo(() => new Vector2(0.0007, 0.0005), []);
  const focus = useRef<DepthOfFieldEffect>(null);
  const look = LOOKS[palette];

  const effects = [
    depthOfField ? (
      <DepthOfField key="dof" ref={focus} target={[0, 0, 0]} worldFocusRange={FOCUS_RANGE} bokehScale={BOKEH_SCALE} />
    ) : null,
    <Bloom key="bloom" mipmapBlur intensity={0.45} luminanceThreshold={0.75} luminanceSmoothing={0.2} />,
    <ChromaticAberration
      key="aberration"
      offset={aberration}
      radialModulation
      modulationOffset={0.35}
      blendFunction={quality.chromaticAberration ? BlendFunction.NORMAL : BlendFunction.SKIP}
    />,
    <ToneMapping key="tone" mode={ToneMappingMode.AGX} />,
    <HueSaturation key="saturation" saturation={look.postSaturation} />,
    <BrightnessContrast key="contrast" contrast={look.contrast} />,
    <Vignette key="vignette" offset={0.18} darkness={look.vignette} />,
    <Noise key="grain" premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={look.grain} />,
  ].filter((effect) => effect !== null);

  return (
    <>
      {depthOfField ? <FocusOnInvestigation effect={focus} /> : null}
      <EffectComposer key={depthOfField ? "focus" : "flat"} multisampling={quality.multisampling}>
        {effects}
      </EffectComposer>
    </>
  );
}
