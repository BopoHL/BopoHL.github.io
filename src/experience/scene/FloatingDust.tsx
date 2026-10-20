"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Vector3, type ShaderMaterial } from "three";
import { BOARD_SIZE } from "@/content/board";
import { useRig } from "../camera/rig";
import { KEY_ANGLE } from "./constants";
import { useLook } from "./look";
import { floatingDustFragmentShader, floatingDustVertexShader } from "./shaders";

const DEPTH = 26;
const MARGIN = 6;

const createVolume = (count: number) => {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * (BOARD_SIZE.width + MARGIN * 2);
    positions[i * 3 + 1] = (Math.random() - 0.5) * (BOARD_SIZE.height + MARGIN * 2);
    positions[i * 3 + 2] = 0.6 + Math.random() * DEPTH;
    seeds[i] = Math.random();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  return geometry;
};

export function FloatingDust({ count }: { count: number }) {
  const look = useLook();
  const rig = useRig();
  const material = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => createVolume(count), [count]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new Color() },
      uLampPosition: { value: new Vector3() },
      uLampDirection: { value: new Vector3(0, 0, -1) },
      uCosOuter: { value: Math.cos(KEY_ANGLE) },
    }),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = state.clock.elapsedTime;
    material.current.uniforms.uColor.value.copy(look.hazeColor);
    material.current.uniforms.uLampPosition.value.copy(rig.lampPosition);
    material.current.uniforms.uLampDirection.value.copy(rig.lampDirection);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={floatingDustVertexShader}
        fragmentShader={floatingDustFragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
