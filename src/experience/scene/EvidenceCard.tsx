"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { MathUtils, type Group, type Texture } from "three";
import { sizeOf } from "@/content/geometry";
import type { Evidence } from "@/content/types";
import { useExperience } from "../state/store";
import { createCardGeometry } from "./cardGeometry";
import { PIN_COLORS, cardZ, finishFor, pinLocal } from "./layout3d";
import { Pin } from "./Pin";

interface EvidenceCardProps {
  item: Evidence;
  index: number;
  texture: Texture;
  bumpMap: Texture;
  onSelect?: (item: Evidence) => void;
}

const HOVER_LIFT = 0.06;

export function EvidenceCard({ item, index, texture, bumpMap, onSelect }: EvidenceCardProps) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const mode = useExperience((state) => state.mode);
  const { width, height } = sizeOf(item);
  const finish = finishFor(item);
  const geometry = useMemo(
    () => createCardGeometry(width, height, finish.lift, finish.curl),
    [width, height, finish.lift, finish.curl],
  );
  const baseZ = cardZ(index);
  const rotation = MathUtils.degToRad(item.rotation);
  const interactive = mode === "explore" || Boolean(item.link);

  useFrame((_, delta) => {
    if (!group.current) return;
    const lift = hovered ? HOVER_LIFT : 0;
    group.current.position.z = MathUtils.damp(group.current.position.z, baseZ + lift, 10, delta);
    group.current.rotation.z = MathUtils.damp(group.current.rotation.z, rotation + (hovered ? 0.01 : 0), 10, delta);
  });

  const handleOver = (event: ThreeEvent<PointerEvent>) => {
    if (event.pointerType !== "mouse") return;
    event.stopPropagation();
    setHovered(true);
    if (interactive) document.body.style.cursor = "pointer";
  };

  const handleOut = () => {
    setHovered(false);
    document.body.style.cursor = "";
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!interactive) return;
    event.stopPropagation();
    onSelect?.(item);
  };

  return (
    <group ref={group} position={[item.position[0], item.position[1], baseZ]} rotation={[0, 0, rotation]}>
      <mesh
        geometry={geometry}
        castShadow
        receiveShadow
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        onClick={handleClick}
      >
        <meshStandardMaterial
          map={texture}
          roughness={finish.roughness}
          bumpMap={bumpMap}
          bumpScale={finish.bumpScale}
          alphaTest={0.5}
        />
      </mesh>
      <Pin position={pinLocal(item)} color={PIN_COLORS[item.area]} />
    </group>
  );
}
