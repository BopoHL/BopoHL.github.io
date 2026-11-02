"use client";

import type { Evidence } from "@/content/types";
import { PIN_COLORS, pinLocal } from "./layout3d";
import { useWorldShader } from "./look";

const HEAD_HEIGHT = 0.11;

export function Pin({ item }: { item: Evidence }) {
  const worldShader = useWorldShader();
  const color = PIN_COLORS[item.area];
  return (
    <group position={pinLocal(item)}>
      <mesh position={[0, 0, HEAD_HEIGHT * 0.45]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, HEAD_HEIGHT * 0.9, 8]} />
        <meshStandardMaterial {...worldShader} color="#b9b4aa" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, HEAD_HEIGHT * 0.78]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.075, HEAD_HEIGHT * 0.5, 16]} />
        <meshStandardMaterial {...worldShader} color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, HEAD_HEIGHT * 1.05]} castShadow>
        <sphereGeometry args={[0.085, 20, 14]} />
        <meshStandardMaterial {...worldShader} color={color} roughness={0.3} />
      </mesh>
    </group>
  );
}
