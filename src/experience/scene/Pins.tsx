"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import type { BufferGeometry, InstancedMesh, Matrix4 } from "three";
import { useExperience } from "../state/store";
import type { CardShape } from "./cardGeometry";
import { PIN_COLORS } from "./layout3d";
import { useAccentShader, useWorldShader } from "./look";
import { pinPlacements } from "./pinField";
import { createPinParts } from "./pinModel";

interface InstancesProps {
  geometry: BufferGeometry;
  matrices: Matrix4[];
  receiveShadow?: boolean;
  children: ReactNode;
}

function Instances({ geometry, matrices, receiveShadow = false, children }: InstancesProps) {
  const mesh = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    matrices.forEach((matrix, i) => mesh.current?.setMatrixAt(i, matrix));
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [geometry, matrices]);

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, matrices.length]} castShadow receiveShadow={receiveShadow}>
      {children}
    </instancedMesh>
  );
}

export function Pins({ shapes }: { shapes: CardShape[] }) {
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
  const placements = useMemo(() => pinPlacements(shapes), [shapes]);
  const needles = useMemo(() => [...placements.values()].flat(), [placements]);

  return (
    <>
      <Instances geometry={parts.needle} matrices={needles}>
        <meshStandardMaterial {...worldShader} color="#c9c6c0" metalness={1} roughness={0.25} />
      </Instances>
      {[...placements].map(([area, matrices]) => (
        <Instances key={area} geometry={parts.head} matrices={matrices} receiveShadow>
          <meshPhysicalMaterial
            {...accentShader}
            color={PIN_COLORS[area]}
            roughness={0.32}
            clearcoat={1}
            clearcoatRoughness={0.08}
            emissive={PIN_COLORS[area]}
            emissiveIntensity={0.06}
          />
        </Instances>
      ))}
    </>
  );
}
