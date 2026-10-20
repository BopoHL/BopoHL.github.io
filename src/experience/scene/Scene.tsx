"use client";

import { useCallback, useMemo } from "react";
import type { BoardContent } from "@/content/selectors";
import type { Evidence, Locale } from "@/content/types";
import { ExploreCamera } from "../camera/ExploreCamera";
import type { Shot } from "../camera/framing";
import { CameraRig, RigContext } from "../camera/rig";
import { RouteCamera } from "../camera/RouteCamera";
import type { Quality } from "../quality";
import { useExperience } from "../state/store";
import { useEvidenceTextures } from "../textures/useEvidenceTextures";
import { CaseBoard } from "./CaseBoard";
import { Effects } from "./Effects";
import { Lighting } from "./Lighting";
import { Room } from "./Room";

interface SceneProps {
  content: BoardContent;
  shots: Shot[];
  locale: Locale;
  quality: Quality;
}

export function Scene({ content, shots, locale, quality }: SceneProps) {
  const rig = useMemo(() => new CameraRig(), []);
  const textures = useEvidenceTextures(content.evidence, locale, quality.pixelsPerUnit);
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
      <color attach="background" args={["#0a0806"]} />
      <fog attach="fog" args={["#0a0806", 30, 75]} />
      <Room textureSize={quality.tier === "high" ? 2048 : 1024} />
      <CaseBoard content={content} textures={textures} locale={locale} onSelect={handleSelect} />
      <Lighting quality={quality} />
      <RouteCamera shots={shots} />
      {mode === "explore" ? <ExploreCamera evidence={content.evidence} /> : null}
      <Effects quality={quality} />
    </RigContext.Provider>
  );
}
