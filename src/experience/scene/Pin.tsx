"use client";

import { useEffect, useMemo } from "react";
import type { PinSpot } from "@/content/geometry";
import type { Evidence } from "@/content/types";
import { useExperience } from "../state/store";
import { PIN_COLORS, pinLocal, pinTilt } from "./layout3d";
import { useAccentShader, useWorldShader } from "./look";
import { createPinParts } from "./pinModel";

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
  const tilt = useMemo(() => pinTilt(item, spot), [item, spot]);
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
