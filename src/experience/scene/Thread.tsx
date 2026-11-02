"use client";

import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { CatmullRomCurve3, TubeGeometry, type PerspectiveCamera, type Vector3 } from "three";
import { useAccentShader } from "./look";
import { THREAD_RADIUS, ThreadShader } from "./threadShader";

interface ThreadProps {
  points: Vector3[];
  color: string;
}

const RADIAL_SEGMENTS = 8;

export function Thread({ points, color }: ThreadProps) {
  const accentShader = useAccentShader();
  const viewportHeight = useThree((state) => state.size.height);
  const { geometry, length } = useMemo(() => {
    const curve = new CatmullRomCurve3(points, false, "centripetal");
    return {
      geometry: new TubeGeometry(curve, points.length * 2, THREAD_RADIUS, RADIAL_SEGMENTS, false),
      length: curve.getLength(),
    };
  }, [points]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const shader = useMemo(() => new ThreadShader(accentShader, length), [accentShader, length]);

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
