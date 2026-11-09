"use client";

import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import type { PerspectiveCamera, Vector3 } from "three";
import { useAccentShader } from "./look";
import { createThreadGeometry } from "./threadGeometry";
import { ThreadShader } from "./threadShader";

interface ThreadProps {
  points: Vector3[];
  color: string;
}

export function Thread({ points, color }: ThreadProps) {
  const accentShader = useAccentShader();
  const viewportHeight = useThree((state) => state.size.height);
  const geometry = useMemo(() => createThreadGeometry(points), [points]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const shader = useMemo(() => new ThreadShader(accentShader), [accentShader]);

  useFrame((state) => shader.updateView((state.camera as PerspectiveCamera).fov, viewportHeight));

  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial
        onBeforeCompile={shader.onBeforeCompile}
        customProgramCacheKey={shader.customProgramCacheKey}
        color={color}
        roughness={0.85}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}
