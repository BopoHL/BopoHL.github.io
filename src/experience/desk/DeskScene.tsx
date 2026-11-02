"use client";

import { useState } from "react";
import type { Texture } from "three";
import { deskEvidence } from "@/content/desk";
import type { Quality } from "../quality";
import type { EvidenceTextures } from "../textures/useEvidenceTextures";
import { Ashtray } from "./Ashtray";
import { Desk } from "./Desk";
import { DeskLamp } from "./DeskLamp";
import { DeskPapers } from "./DeskPapers";
import { DeskContext, DeskState } from "./deskState";

interface DeskSceneProps {
  textures: EvidenceTextures;
  bumpMap: Texture;
  quality: Quality;
}

export function DeskScene({ textures, bumpMap, quality }: DeskSceneProps) {
  const [desk] = useState(() => new DeskState());
  return (
    <DeskContext.Provider value={desk}>
      <Desk />
      <DeskPapers evidence={deskEvidence} textures={textures} bumpMap={bumpMap} />
      <DeskLamp quality={quality} />
      <Ashtray />
    </DeskContext.Provider>
  );
}
