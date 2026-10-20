"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, MathUtils, SRGBColorSpace, type Mesh, type MeshStandardMaterial } from "three";
import { resolveFontFamilies } from "../painters";
import { STAMP_ASPECT, paintStampCanvas } from "../painters/stamp";
import { useAccentShader } from "./look";

interface StampProps {
  text: string;
  visible: boolean;
  position: [number, number, number];
  width: number;
  rotation: number;
  delay?: number;
}

const paintStampTexture = (text: string) => {
  const texture = new CanvasTexture(paintStampCanvas(text, resolveFontFamilies()));
  texture.colorSpace = SRGBColorSpace;
  return texture;
};

export function Stamp({ text, visible, position, width, rotation, delay = 0.9 }: StampProps) {
  const mesh = useRef<Mesh>(null);
  const shownFor = useRef(0);
  const texture = useMemo(() => paintStampTexture(text), [text]);
  const accentShader = useAccentShader();
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    shownFor.current = visible ? shownFor.current + delta : 0;
    const t = MathUtils.clamp((shownFor.current - delay) / 0.22, 0, 1);
    const scale = MathUtils.lerp(1.7, 1, 1 - (1 - t) ** 3);
    mesh.current.scale.setScalar(scale);
    const material = mesh.current.material as MeshStandardMaterial;
    material.opacity = t;
    mesh.current.visible = t > 0;
  });

  return (
    <mesh ref={mesh} position={position} rotation={[0, 0, rotation]} visible={false}>
      <planeGeometry args={[width, width * STAMP_ASPECT]} />
      <meshStandardMaterial
        {...accentShader}
        map={texture}
        emissive="#ffffff"
        emissiveMap={texture}
        emissiveIntensity={0.45}
        transparent
        depthWrite={false}
        roughness={0.9}
      />
    </mesh>
  );
}
