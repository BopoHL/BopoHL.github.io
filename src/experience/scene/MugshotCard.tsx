"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, type Group, type Texture } from "three";
import { sizeOf } from "@/content/geometry";
import type { Evidence, PhotoEvidence } from "@/content/types";
import { useExperience } from "../state/store";
import { wearFor } from "../wear/profile";
import { createCardGeometry } from "./cardGeometry";
import { useWorldShader } from "./look";
import { PIN_COLORS, REVEAL_STAMP, cardZ, finishFor, pinLocal } from "./layout3d";
import { Pin } from "./Pin";
import { Stamp } from "./Stamp";
import { useSurfaceBump } from "./useSurfaceBump";

interface MugshotCardProps {
  item: PhotoEvidence;
  index: number;
  front: Texture;
  back: Texture;
  bumpMap: Texture;
  stampText: string;
  onSelect: (item: Evidence) => void;
}

const FLIP_LIFT = 0.9;

export function MugshotCard({ item, index, front, back, bumpMap, stampText, onSelect }: MugshotCardProps) {
  const flipper = useRef<Group>(null);
  const flip = useRef(0);
  const revealed = useExperience((state) => state.revealed);
  const worldShader = useWorldShader();
  const { width, height } = sizeOf(item);
  const finish = finishFor(item);
  const wear = useMemo(() => wearFor(item), [item]);
  const geometry = useMemo(
    () => createCardGeometry({ item, finish: { ...finishFor(item), lift: 0, curl: 0 }, wear, occluders: [] }),
    [item, wear],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  const surfaceBump = useSurfaceBump(bumpMap, item.id);
  const bumpScale = finish.bumpScale * (0.6 + wear.crumple);
  const rotation = MathUtils.degToRad(item.rotation);

  useFrame((_, delta) => {
    if (!flipper.current) return;
    flip.current = MathUtils.damp(flip.current, revealed ? 1 : 0, 3.2, delta);
    flipper.current.rotation.y = flip.current * Math.PI;
    flipper.current.position.z = Math.sin(flip.current * Math.PI) * FLIP_LIFT;
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (useExperience.getState().mode !== "explore") return;
    event.stopPropagation();
    onSelect(item);
  };

  return (
    <group position={[item.position[0], item.position[1], cardZ(index)]} rotation={[0, 0, rotation]}>
      <group ref={flipper} onClick={handleClick}>
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial {...worldShader} map={front} roughness={finish.roughness} bumpMap={surfaceBump} bumpScale={bumpScale} />
        </mesh>
        <mesh geometry={geometry} rotation={[0, Math.PI, 0]} position={[0, 0, -0.004]} castShadow receiveShadow>
          <meshStandardMaterial {...worldShader} map={back} roughness={finish.roughness} bumpMap={surfaceBump} bumpScale={bumpScale} />
        </mesh>
      </group>
      <Stamp
        text={stampText}
        visible={revealed}
        position={[0, height * REVEAL_STAMP.offsetY, REVEAL_STAMP.lift]}
        width={width * REVEAL_STAMP.widthRatio}
        rotation={REVEAL_STAMP.rotation}
      />
      <Pin position={pinLocal(item)} color={PIN_COLORS[item.area]} />
    </group>
  );
}
