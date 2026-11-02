"use client";

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import { evidence as boardEvidence } from "@/content/board";
import { deskEvidence } from "@/content/desk";
import type { BoardContent } from "@/content/selectors";
import type { Evidence, Locale } from "@/content/types";
import { ExploreCamera } from "../camera/ExploreCamera";
import type { Shot } from "../camera/framing";
import type { CameraMotion } from "../camera/motion";
import { CameraRig, RigContext } from "../camera/rig";
import { RouteCamera } from "../camera/RouteCamera";
import type { Quality } from "../quality";
import type { Palette } from "../state/variant";
import { useExperience } from "../state/store";
import { DeskScene } from "../desk/DeskScene";
import { usePaperBump } from "../textures/usePaperBump";
import { useEvidenceTextures } from "../textures/useEvidenceTextures";
import { CaseBoard } from "./CaseBoard";
import { Effects } from "./Effects";
import { FloatingDust } from "./FloatingDust";
import { Lighting } from "./Lighting";
import { LOOKS, LookContext, LookState } from "./look";
import { Room } from "./Room";

interface SceneProps {
  content: BoardContent;
  shots: Shot[];
  motion: CameraMotion;
  locale: Locale;
  quality: Quality;
}

function LookController({ look, palette }: { look: LookState; palette: Palette }) {
  useEffect(() => look.setTarget(LOOKS[palette]), [look, palette]);
  useFrame((_, delta) => look.update(delta));
  return null;
}

const PAINTED_EVIDENCE = [...boardEvidence, ...deskEvidence];

export function Scene({ content, shots, motion, locale, quality }: SceneProps) {
  const rig = useMemo(() => new CameraRig(), []);
  const palette = useExperience((state) => state.variant.palette);
  const [look] = useState(() => new LookState(LOOKS[palette]));
  const cinema = useExperience((state) => state.variant.camera === "cinema");
  const textures = useEvidenceTextures(PAINTED_EVIDENCE, locale, quality.pixelsPerUnit);
  const bumpMap = usePaperBump();
  const mode = useExperience((state) => state.mode);
  const focusEvidence = useExperience((state) => state.focusEvidence);

  const handleSelect = useCallback(
    (item: Evidence) => {
      if (useExperience.getState().mode === "explore") {
        focusEvidence(item.id);
        return;
      }
      if (item.link) window.open(item.link, "_blank", "noopener");
    },
    [focusEvidence],
  );

  return (
    <RigContext.Provider value={rig}>
      <LookContext.Provider value={look}>
        <LookController look={look} palette={palette} />
        <color attach="background" args={["#0a0806"]} />
        <fog attach="fog" args={["#0a0806", 30, 75]} />
        <Room textureSize={quality.tier === "high" ? 2048 : 1024} />
        <CaseBoard content={content} textures={textures} bumpMap={bumpMap} locale={locale} onSelect={handleSelect} />
        <DeskScene textures={textures} bumpMap={bumpMap} quality={quality} locale={locale} />
        <Lighting quality={quality} />
        <RouteCamera shots={shots} motion={motion} />
        {mode === "explore" ? <ExploreCamera evidence={content.evidence} /> : null}
        {cinema ? <FloatingDust count={quality.dustCount * 2} /> : null}
        <Effects quality={quality} palette={palette} lensFocus={cinema} />
      </LookContext.Provider>
    </RigContext.Provider>
  );
}
