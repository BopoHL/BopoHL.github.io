"use client";

import type { Texture } from "three";
import { deskEvidence } from "@/content/desk";
import type { EvidenceTextures } from "../textures/useEvidenceTextures";
import { Desk } from "./Desk";
import { DeskPapers } from "./DeskPapers";

interface DeskSceneProps {
  textures: EvidenceTextures;
  bumpMap: Texture;
}

export function DeskScene({ textures, bumpMap }: DeskSceneProps) {
  return (
    <group>
      <Desk />
      <DeskPapers evidence={deskEvidence} textures={textures} bumpMap={bumpMap} />
    </group>
  );
}
