"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, type Group, type Texture } from "three";
import { TAPE_KEYS, type TapeDeck, type TapeKey } from "@/audio/tape";
import { useAccentShader, useWorldShader } from "../scene/look";
import { isTap } from "../scene/pointer";
import { pointerCursor } from "./deskState";

export const KEY = { width: 0.27, height: 0.2, length: 0.44, gap: 0.035, rise: 0.09, latch: 0.055, press: 0.08 };
const PRESS_SECONDS = 0.14;
const TRAVEL_SPEED = 30;

export const KEYS_SPAN = TAPE_KEYS.length * KEY.width + (TAPE_KEYS.length - 1) * KEY.gap;

interface TapeKeysProps {
  deck: TapeDeck;
  symbols: Record<TapeKey, Texture>;
  onPress: (key: TapeKey) => void;
}

export function TapeKeys({ deck, symbols, onPress }: TapeKeysProps) {
  const worldShader = useWorldShader();
  const accentShader = useAccentShader();
  const keys = useRef<Array<Group | null>>([]);
  const pressedAt = useRef<Partial<Record<TapeKey, number>>>({});

  useFrame((_, delta) => {
    const now = performance.now() / 1000;
    TAPE_KEYS.forEach((key, index) => {
      const group = keys.current[index];
      if (!group) return;
      const pressing = now - (pressedAt.current[key] ?? Number.NEGATIVE_INFINITY) < PRESS_SECONDS;
      const depth = pressing ? KEY.press : deck.isLatched(key) ? KEY.latch : 0;
      group.position.y = MathUtils.damp(group.position.y, -depth, TRAVEL_SPEED, delta);
    });
  });

  const press = (key: TapeKey) => (event: ThreeEvent<MouseEvent>) => {
    if (!isTap(event)) return;
    event.stopPropagation();
    pressedAt.current[key] = performance.now() / 1000;
    onPress(key);
  };

  return (
    <group>
      {TAPE_KEYS.map((key, index) => (
        <group
          key={key}
          ref={(group) => {
            keys.current[index] = group;
          }}
          position={[-KEYS_SPAN / 2 + KEY.width / 2 + index * (KEY.width + KEY.gap), 0, 0]}
          onClick={press(key)}
          {...pointerCursor}
        >
          <mesh position={[0, KEY.rise - KEY.height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[KEY.width, KEY.height, KEY.length]} />
            {key === "record" ? (
              <meshStandardMaterial {...accentShader} color="#a3271d" roughness={0.4} />
            ) : (
              <meshStandardMaterial {...worldShader} color="#c9c9c3" metalness={0.85} roughness={0.3} />
            )}
          </mesh>
          <mesh position={[0, KEY.rise + 0.001, KEY.length * 0.18]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, 0.2]} />
            <meshStandardMaterial {...worldShader} map={symbols[key]} transparent depthWrite={false} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
