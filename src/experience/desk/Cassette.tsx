"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh, Texture } from "three";
import type { TapeDeck } from "@/audio/tape";
import { useWorldShader } from "../scene/look";
import { REEL, reelState } from "./reels";
import { CASSETTE, CASSETTE_WINDOW_Z } from "./recorderTextures";

const SHELL = { base: 0.075, wall: 0.03, rim: 0.04 };
const PACK_HEIGHT = 0.022;
const HUB = { flange: REEL.hub - 0.005, bore: 0.07, teeth: 6 };

interface CassetteProps {
  face: Texture;
  deck: TapeDeck;
}

export function Cassette({ face, deck }: CassetteProps) {
  const worldShader = useWorldShader();
  const supply = useRef<Group>(null);
  const takeUp = useRef<Group>(null);
  const supplyPack = useRef<Mesh>(null);
  const takeUpPack = useRef<Mesh>(null);

  useFrame(() => {
    const reels = reelState(deck.progress, deck.duration);
    supply.current?.rotation.set(0, -reels.supplyAngle, 0);
    takeUp.current?.rotation.set(0, -reels.takeUpAngle, 0);
    supplyPack.current?.scale.set(reels.supplyRadius, 1, reels.supplyRadius);
    takeUpPack.current?.scale.set(reels.takeUpRadius, 1, reels.takeUpRadius);
  });

  const shell = <meshStandardMaterial {...worldShader} color="#1f1d1b" roughness={0.35} />;
  const top = SHELL.base + SHELL.rim;
  const reels = [
    { side: -1, hub: supply, pack: supplyPack },
    { side: 1, hub: takeUp, pack: takeUpPack },
  ] as const;

  return (
    <group>
      <mesh position={[0, SHELL.base / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[CASSETTE.width, SHELL.base, CASSETTE.depth]} />
        {shell}
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`z${side}`} position={[0, SHELL.base + SHELL.rim / 2, (side * (CASSETTE.depth - SHELL.wall)) / 2]}>
          <boxGeometry args={[CASSETTE.width, SHELL.rim, SHELL.wall]} />
          {shell}
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`x${side}`} position={[(side * (CASSETTE.width - SHELL.wall)) / 2, SHELL.base + SHELL.rim / 2, 0]}>
          <boxGeometry args={[SHELL.wall, SHELL.rim, CASSETTE.depth - SHELL.wall * 2]} />
          {shell}
        </mesh>
      ))}
      {reels.map(({ side, hub, pack }) => (
        <group key={side} position={[(side * CASSETTE.hubSpacing) / 2, SHELL.base, CASSETTE_WINDOW_Z]}>
          <mesh ref={pack} position={[0, PACK_HEIGHT / 2, 0]}>
            <cylinderGeometry args={[1, 1, PACK_HEIGHT, 48]} />
            <meshStandardMaterial {...worldShader} color="#3a2a1f" roughness={0.3} metalness={0.25} />
          </mesh>
          <group ref={hub}>
            <mesh position={[0, PACK_HEIGHT / 2 + 0.002, 0]}>
              <cylinderGeometry args={[HUB.flange, HUB.flange, PACK_HEIGHT + 0.004, 32]} />
              <meshStandardMaterial {...worldShader} color="#e8e4da" roughness={0.45} />
            </mesh>
            <mesh position={[0, PACK_HEIGHT / 2 + 0.004, 0]}>
              <cylinderGeometry args={[HUB.bore, HUB.bore, PACK_HEIGHT + 0.004, 24]} />
              <meshStandardMaterial {...worldShader} color="#141312" roughness={0.6} />
            </mesh>
            {Array.from({ length: HUB.teeth }, (_, index) => {
              const angle = (index / HUB.teeth) * Math.PI * 2;
              return (
                <mesh
                  key={index}
                  position={[Math.cos(angle) * (HUB.bore - 0.012), PACK_HEIGHT / 2 + 0.005, Math.sin(angle) * (HUB.bore - 0.012)]}
                  rotation={[0, -angle, 0]}
                >
                  <boxGeometry args={[0.03, PACK_HEIGHT + 0.004, 0.018]} />
                  <meshStandardMaterial {...worldShader} color="#e8e4da" roughness={0.45} />
                </mesh>
              );
            })}
          </group>
        </group>
      ))}
      <mesh position={[0, top + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[CASSETTE.width, CASSETTE.depth]} />
        <meshStandardMaterial {...worldShader} map={face} alphaTest={0.5} roughness={0.55} />
      </mesh>
    </group>
  );
}
