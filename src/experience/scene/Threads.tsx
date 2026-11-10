"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import type { PerspectiveCamera } from "three";
import type { ThreadRun } from "./boardSurface";
import { THREAD_COLORS } from "./layout3d";
import { useAccentShader } from "./look";
import { createThreadStrands } from "./threadGeometry";
import { ThreadShader } from "./threadShader";

export function Threads({ runs }: { runs: ThreadRun[] }) {
  const accentShader = useAccentShader();
  const viewportHeight = useThree((state) => state.size.height);
  const strands = useMemo(() => createThreadStrands(runs), [runs]);
  useEffect(() => () => strands.forEach((strand) => strand.dispose()), [strands]);
  const shader = useMemo(() => new ThreadShader(accentShader), [accentShader]);

  useFrame((state) => shader.updateView((state.camera as PerspectiveCamera).fov, viewportHeight));

  return [...strands].map(([area, strand]) => (
    <mesh key={area} geometry={strand} castShadow>
      <meshStandardMaterial
        onBeforeCompile={shader.onBeforeCompile}
        customProgramCacheKey={shader.customProgramCacheKey}
        color={THREAD_COLORS[area]}
        roughness={0.85}
        emissive={THREAD_COLORS[area]}
        emissiveIntensity={0.1}
      />
    </mesh>
  ));
}
