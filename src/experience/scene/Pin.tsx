"use client";

import { PIN_HEAD_HEIGHT } from "./layout3d";
import { useWorldShader } from "./look";

interface PinProps {
  position: [number, number, number];
  color: string;
}

export function Pin({ position, color }: PinProps) {
  const worldShader = useWorldShader();
  return (
    <group position={position}>
      <mesh position={[0, 0, PIN_HEAD_HEIGHT * 0.45]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, PIN_HEAD_HEIGHT * 0.9, 8]} />
        <meshStandardMaterial {...worldShader} color="#b9b4aa" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, PIN_HEAD_HEIGHT * 0.78]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.075, PIN_HEAD_HEIGHT * 0.5, 16]} />
        <meshStandardMaterial {...worldShader} color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, PIN_HEAD_HEIGHT * 1.05]} castShadow>
        <sphereGeometry args={[0.085, 20, 14]} />
        <meshStandardMaterial {...worldShader} color={color} roughness={0.3} />
      </mesh>
    </group>
  );
}
