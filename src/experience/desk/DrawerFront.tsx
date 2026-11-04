"use client";

import { useWorldShader } from "../scene/look";
import { DRAWER } from "./layout";

export function DrawerFront({ material }: { material: React.ReactNode }) {
  const worldShader = useWorldShader();
  return (
    <>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[DRAWER.width, DRAWER.height, 0.06]} />
        {material}
      </mesh>
      <mesh position={[0, 0, 0.12]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.9, 12]} />
        <meshStandardMaterial {...worldShader} color="#b08d57" metalness={0.9} roughness={0.35} />
      </mesh>
    </>
  );
}
