"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { MathUtils, type Group, type Texture } from "three";
import { sizeOf } from "@/content/geometry";
import type { Evidence, PhotoEvidence } from "@/content/types";
import { useExperience } from "../state/store";
import { createCardGeometry } from "./cardGeometry";
import { PIN_COLORS, REVEAL_STAMP, cardZ, finishFor, pinLocal } from "./layout3d";
import { Pin } from "./Pin";
import { Stamp } from "./Stamp";

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
  const { width, height } = sizeOf(item);
  const finish = finishFor(item);
  const geometry = useMemo(() => createCardGeometry(width, height, 0, 0), [width, height]);
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
          <meshStandardMaterial map={front} roughness={finish.roughness} bumpMap={bumpMap} bumpScale={finish.bumpScale} />
        </mesh>
        <mesh geometry={geometry} rotation={[0, Math.PI, 0]} position={[0, 0, -0.004]} castShadow receiveShadow>
          <meshStandardMaterial map={back} roughness={finish.roughness} bumpMap={bumpMap} bumpScale={finish.bumpScale} />
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
