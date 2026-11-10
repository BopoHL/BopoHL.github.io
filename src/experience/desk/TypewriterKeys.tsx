"use client";

import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BatchedMesh, MathUtils, Matrix4, type Group, type InstancedMesh, type Texture } from "three";
import { useWorldShader } from "../scene/look";
import { useExperience } from "../state/store";
import { createCapGeometry, keyIndexFor, TYPEWRITER, type KeySpot } from "./typewriterModel";

const KEY_TRAVEL = 0.07;
const KEY_RETURN = 18;
const RESTED = 1e-4;
const SPACE_INDEX = -1;
const STEM = { radius: 0.025, length: 0.24, drop: -0.12 };
const CAP_LIFT = 0.026;

const createTops = (spots: KeySpot[]) => {
  const caps = spots.map((spot) => createCapGeometry(spot.cell));
  const vertices = caps.reduce((sum, cap) => sum + cap.getAttribute("position").count, 0);
  const indices = caps.reduce((sum, cap) => sum + (cap.index?.count ?? 0), 0);
  const tops = new BatchedMesh(caps.length, vertices, indices);
  tops.perObjectFrustumCulled = false;
  tops.sortObjects = false;
  for (const cap of caps) {
    tops.addInstance(tops.addGeometry(cap));
    cap.dispose();
  }
  return tops;
};

export function TypewriterKeys({ spots, atlas }: { spots: KeySpot[]; atlas: Texture | null }) {
  const worldShader = useWorldShader();
  const stems = useRef<InstancedMesh>(null);
  const rims = useRef<InstancedMesh>(null);
  const spaceBar = useRef<Group>(null);
  const tops = useMemo(() => createTops(spots), [spots]);
  useEffect(() => () => tops.dispose(), [tops]);
  const placement = useMemo(() => new Matrix4(), []);
  const struck = useRef({ serial: useExperience.getState().keystroke.serial, index: null as number | null, depth: 0 });

  const press = useCallback(
    (index: number, depth: number) => {
      const [x, y, z] = spots[index].position;
      stems.current?.setMatrixAt(index, placement.makeTranslation(x, y - depth + STEM.drop, z));
      rims.current?.setMatrixAt(index, placement.makeTranslation(x, y - depth, z));
      tops.setMatrixAt(index, placement.makeTranslation(x, y - depth + CAP_LIFT, z));
      for (const keys of [stems.current, rims.current]) if (keys) keys.instanceMatrix.needsUpdate = true;
    },
    [placement, spots, tops],
  );

  useLayoutEffect(() => {
    spots.forEach((_, index) => press(index, 0));
    stems.current?.computeBoundingSphere();
    rims.current?.computeBoundingSphere();
  }, [press, spots]);

  useFrame((_, delta) => {
    const { keystroke } = useExperience.getState();
    const strike = struck.current;
    if (keystroke.serial !== strike.serial) {
      if (strike.index !== null && strike.index !== SPACE_INDEX) press(strike.index, 0);
      strike.serial = keystroke.serial;
      strike.index = keystroke.char === " " ? SPACE_INDEX : (keyIndexFor(spots, keystroke.char) ?? Math.floor(Math.random() * spots.length));
      strike.depth = KEY_TRAVEL;
    }
    if (strike.index === null || strike.depth === 0) return;
    strike.depth = MathUtils.damp(strike.depth, 0, KEY_RETURN, delta);
    if (strike.depth < RESTED) strike.depth = 0;
    if (strike.index !== SPACE_INDEX) press(strike.index, strike.depth);
    else if (spaceBar.current) spaceBar.current.position.y = -strike.depth;
  });

  const chrome = <meshStandardMaterial {...worldShader} color="#d0d0cb" metalness={1} roughness={0.22} />;

  return (
    <>
      <instancedMesh ref={stems} args={[undefined, undefined, spots.length]}>
        <cylinderGeometry args={[STEM.radius, STEM.radius, STEM.length, 6]} />
        {chrome}
      </instancedMesh>
      <instancedMesh ref={rims} args={[undefined, undefined, spots.length]} castShadow>
        <cylinderGeometry args={[TYPEWRITER.capRadius, TYPEWRITER.capRadius * 0.95, 0.05, 28]} />
        {chrome}
      </instancedMesh>
      <primitive object={tops}>
        <meshPhysicalMaterial {...worldShader} attach="material" map={atlas} color="#ffffff" roughness={0.2} clearcoat={1} />
      </primitive>
      <group ref={spaceBar}>
        <mesh position={[0, TYPEWRITER.baseHeight + 0.08, TYPEWRITER.frontRow + 0.36]} castShadow>
          <boxGeometry args={[2.4, 0.06, 0.14]} />
          {chrome}
        </mesh>
      </group>
    </>
  );
}
