"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { MathUtils, type Group, type Texture } from "three";
import { pinOffsetOf, sizeOf } from "@/content/geometry";
import type { Evidence } from "@/content/types";
import { useExperience } from "../state/store";
import { createCardGeometry, minimumGap, type CardShape } from "./cardGeometry";
import { usePaperShader } from "./look";
import { cardZ } from "./layout3d";
import { Pin } from "./Pin";
import { useSurfaceBump } from "./useSurfaceBump";

interface EvidenceCardProps {
  shape: CardShape;
  texture: Texture;
  accentMask?: Texture;
  canLift: boolean;
  bumpMap: Texture;
  onSelect?: (item: Evidence) => void;
}

const HOVER_EDGE_LIFT = 0.14;

export function EvidenceCard({ shape, texture, accentMask, canLift, bumpMap, onSelect }: EvidenceCardProps) {
  const { item, finish, wear } = shape;
  const hinge = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const mode = useExperience((state) => state.mode);
  const paperShader = usePaperShader(accentMask);
  const geometry = useMemo(() => createCardGeometry(shape), [shape]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const surfaceBump = useSurfaceBump(bumpMap, item.id);
  const [pinX, pinY] = pinOffsetOf(item);
  const hoverAngle = useMemo(() => {
    if (!canLift) return 0;
    const reach = pinY + sizeOf(item).height / 2;
    return -Math.atan(Math.min(HOVER_EDGE_LIFT, minimumGap(shape)) / reach);
  }, [canLift, item, pinY, shape]);
  const interactive = mode === "explore" || Boolean(item.link);

  useFrame((_, delta) => {
    if (!hinge.current) return;
    hinge.current.rotation.x = MathUtils.damp(hinge.current.rotation.x, hovered ? hoverAngle : 0, 10, delta);
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
    <group
      position={[item.position[0], item.position[1], cardZ(shape.index)]}
      rotation={[0, 0, MathUtils.degToRad(item.rotation)]}
    >
      <group ref={hinge} position={[pinX, pinY, 0]}>
        <mesh
          geometry={geometry}
          position={[-pinX, -pinY, 0]}
          castShadow
          receiveShadow
          onPointerOver={handleOver}
          onPointerOut={handleOut}
          onClick={handleClick}
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
      </group>
      {shape.pins.map((spot) => (
        <Pin key={spot} item={item} spot={spot} />
      ))}
    </group>
  );
}
