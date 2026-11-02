"use client";

import { useEffect, useMemo } from "react";
import type { PinSpot } from "@/content/geometry";
import type { Evidence } from "@/content/types";
import { seededRandom } from "../painters/random";
import { useExperience } from "../state/store";
import { PIN_COLORS, pinLocal } from "./layout3d";
import { useAccentShader, useWorldShader } from "./look";
import { createPinParts } from "./pinModel";

const MAX_TILT = 0.07;

export function Pin({ item, spot }: { item: Evidence; spot: PinSpot }) {
  const style = useExperience((state) => state.variant.pins);
  const accentShader = useAccentShader();
  const worldShader = useWorldShader();
  const parts = useMemo(() => createPinParts(style), [style]);
  useEffect(
    () => () => {
      parts.head.dispose();
      parts.needle.dispose();
    },
    [parts],
  );
  const tilt = useMemo(() => {
    const random = seededRandom(`${item.id}-${spot}-pin`);
    return [(random() * 2 - 1) * MAX_TILT, (random() * 2 - 1) * MAX_TILT, 0] as const;
  }, [item.id, spot]);
  const color = PIN_COLORS[item.area];

  return (
    <group position={pinLocal(item, spot)} rotation={tilt}>
      <mesh geometry={parts.needle} castShadow>
        <meshStandardMaterial {...worldShader} color="#c9c6c0" metalness={1} roughness={0.25} />
      </mesh>
      <mesh geometry={parts.head} castShadow receiveShadow>
        <meshPhysicalMaterial
          {...accentShader}
          color={color}
          roughness={0.32}
          clearcoat={1}
          clearcoatRoughness={0.08}
          emissive={color}
          emissiveIntensity={0.06}
        />
      </mesh>
    </group>
  );
}
