"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, MathUtils, SRGBColorSpace, type Mesh, type MeshStandardMaterial } from "three";
import { resolveFontFamilies } from "../painters";
import { seededRandom } from "../painters/random";
import { drawStamp } from "../painters/stamp";
import { createSurface } from "../painters/surface";

interface StampProps {
  text: string;
  visible: boolean;
  position: [number, number, number];
  width: number;
  rotation: number;
  delay?: number;
}

const ASPECT = 0.3;

const paintStampTexture = (text: string) => {
  const surface = createSurface(1400, 1400 * ASPECT, seededRandom(`stamp-${text}`), resolveFontFamilies());
  drawStamp(surface, {
    text,
    x: surface.width / 2,
    y: surface.height / 2,
    height: surface.height * 0.82,
    rotation: 0,
    opacity: 1,
  });
  const texture = new CanvasTexture(surface.canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};

export function Stamp({ text, visible, position, width, rotation, delay = 0.9 }: StampProps) {
  const mesh = useRef<Mesh>(null);
  const shownFor = useRef(0);
  const texture = useMemo(() => paintStampTexture(text), [text]);
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
      <planeGeometry args={[width, width * ASPECT]} />
      <meshStandardMaterial
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
