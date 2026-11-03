"use client";

import {
  Bloom,
  BrightnessContrast,
  ChromaticAberration,
  EffectComposer,
  HueSaturation,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { useEffect, useMemo } from "react";
import { Vector2 } from "three";
import { useRig } from "../camera/rig";
import type { Quality } from "../quality";
import { useExperience } from "../state/store";
import type { Palette } from "../state/variant";
import { FilmGrainEffect } from "./filmGrain";
import { Lens } from "./lens";
import { LOOKS } from "./look";

interface EffectsProps {
  quality: Quality;
  palette: Palette;
  lensFocus: boolean;
}

function LensFocus({ lens }: { lens: Lens }) {
  const rig = useRig();
  useFrame((_, delta) => lens.update(rig.target, useExperience.getState().mode === "explore", delta));
  return null;
}

export function Effects({ quality, palette, lensFocus }: EffectsProps) {
  const aberration = useMemo(() => new Vector2(0.0007, 0.0005), []);
  const camera = useThree((state) => state.camera);
  const look = LOOKS[palette];
  const grain = useMemo(() => new FilmGrainEffect(look.grain), [look.grain]);
  useEffect(() => () => grain.dispose(), [grain]);
  const lens = useMemo(() => (lensFocus ? new Lens(camera, quality.focusBlur) : null), [lensFocus, camera, quality.focusBlur]);
  useEffect(() => () => lens?.dispose(), [lens]);

  const effects = [
    lens ? <primitive key="dof" object={lens.focus} /> : null,
    lens ? <primitive key="peripheral" object={lens.peripheral} /> : null,
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
    <primitive key="grain" object={grain} />,
  ].filter((effect) => effect !== null);

  return (
    <>
      {lens ? <LensFocus lens={lens} /> : null}
      <EffectComposer key={lensFocus ? "focus" : "flat"} multisampling={quality.multisampling}>
        {effects}
      </EffectComposer>
    </>
  );
}
