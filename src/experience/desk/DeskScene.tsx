"use client";

import { useState } from "react";
import type { Texture } from "three";
import { deskEvidence } from "@/content/desk";
import type { Locale } from "@/content/types";
import type { Quality } from "../quality";
import type { EvidenceTextures } from "../textures/useEvidenceTextures";
import { Ashtray } from "./Ashtray";
import { CassetteRecorder } from "./CassetteRecorder";
import { Desk } from "./Desk";
import { DeskFan } from "./DeskFan";
import { DeskLamp } from "./DeskLamp";
import { DeskPapers } from "./DeskPapers";
import { DeskContext, DeskState } from "./deskState";
import { RotaryPhone } from "./RotaryPhone";
import { Secrets } from "./Secrets";
import { Typewriter } from "./Typewriter";

interface DeskSceneProps {
  textures: EvidenceTextures;
  bumpMap: Texture;
  quality: Quality;
  locale: Locale;
}

export function DeskScene({ textures, bumpMap, quality, locale }: DeskSceneProps) {
  const [desk] = useState(() => new DeskState());
  return (
    <DeskContext.Provider value={desk}>
      <Desk locale={locale} />
      <DeskPapers evidence={deskEvidence} textures={textures} bumpMap={bumpMap} />
      <DeskLamp quality={quality} />
      <Ashtray quality={quality} />
      <DeskFan />
      <CassetteRecorder locale={locale} />
      <Typewriter locale={locale} />
      <RotaryPhone locale={locale} />
      <Secrets locale={locale} />
    </DeskContext.Provider>
  );
}
