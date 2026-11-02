"use client";

import { useEffect, useMemo } from "react";
import { MathUtils, type Texture } from "three";
import type { Evidence } from "@/content/types";
import { cardShapesFor, createCardGeometry, type CardShape } from "../scene/cardGeometry";
import { cardZ } from "../scene/layout3d";
import { usePaperShader } from "../scene/look";
import { useSurfaceBump } from "../scene/useSurfaceBump";
import type { EvidenceTextures } from "../textures/useEvidenceTextures";
import { DESK } from "./layout";

const RESTING = 0.004;

function DeskPaper({ shape, texture, accentMask, bumpMap }: { shape: CardShape; texture: Texture; accentMask?: Texture; bumpMap: Texture }) {
  const { item, finish, wear } = shape;
  const geometry = useMemo(() => createCardGeometry(shape), [shape]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const paperShader = usePaperShader(accentMask);
  const surfaceBump = useSurfaceBump(bumpMap, item.id);
  return (
    <mesh
      geometry={geometry}
      position={[item.position[0], -item.position[1], cardZ(shape.index) - cardZ(0) + RESTING]}
      rotation={[0, 0, MathUtils.degToRad(item.rotation)]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        key={paperShader.customProgramCacheKey()}
        {...paperShader}
        map={texture}
        roughness={finish.roughness}
        bumpMap={surfaceBump}
        bumpScale={finish.bumpScale * (0.6 + wear.crumple)}
        alphaTest={0.5}
        alphaToCoverage
      />
    </mesh>
  );
}

interface DeskPapersProps {
  evidence: Evidence[];
  textures: EvidenceTextures;
  bumpMap: Texture;
}

export function DeskPapers({ evidence, textures, bumpMap }: DeskPapersProps) {
  const shapes = useMemo(() => cardShapesFor(evidence, new Map(evidence.map((item) => [item.id, []]))), [evidence]);
  return (
    <group position={[0, DESK.top, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {shapes.map((shape) => {
        const texture = textures.front.get(shape.item.id);
        if (!texture) return null;
        return (
          <DeskPaper
            key={shape.item.id}
            shape={shape}
            texture={texture}
            accentMask={textures.accent.get(shape.item.id)}
            bumpMap={bumpMap}
          />
        );
      })}
    </group>
  );
}
