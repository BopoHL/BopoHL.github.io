"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { LatheGeometry, MathUtils, Vector2, Vector3, type MeshStandardMaterial, type PointLight } from "three";
import { seededRandom } from "@/lib/random";
import { useAccentShader, useWorldShader } from "../scene/look";
import { onDesk, PROPS } from "./layout";
import { Smoke } from "./Smoke";

const BOWL_PROFILE: Array<[number, number]> = [
  [0, 0],
  [0.95, 0],
  [1.0, 0.04],
  [1.02, 0.26],
  [0.96, 0.33],
  [0.84, 0.33],
  [0.76, 0.27],
  [0.68, 0.13],
  [0, 0.12],
];
const REST = { x: 0.98, y: 0.37, tilt: MathUtils.degToRad(8) };
const CIGARETTE = { inner: 0.5, ash: 0.14, ember: 0.03, paper: 0.42, filter: 0.28, radius: 0.055 };
const EMBER_COLOR = "#ff5a1a";

type Part = "ash" | "ember" | "paper" | "filter";

const CIGARETTE_PARTS = (["ash", "ember", "paper", "filter"] as const).reduce(
  (parts, part) => {
    const start = parts.cursor;
    const length = CIGARETTE[part];
    parts.cursor += length;
    parts.layout[part] = { position: [start + length / 2, 0, 0], length };
    return parts;
  },
  { cursor: -CIGARETTE.inner, layout: {} as Record<Part, { position: [number, number, number]; length: number }> },
).layout;

export function Ashtray() {
  const worldShader = useWorldShader();
  const accentShader = useAccentShader();
  const ember = useRef<MeshStandardMaterial>(null);
  const glow = useRef<PointLight>(null);
  const base = useMemo(() => new Vector3(...onDesk(PROPS.ashtray.at)), []);
  const bowl = useMemo(
    () =>
      new LatheGeometry(
        BOWL_PROFILE.map(([r, y]) => new Vector2(r, y)),
        48,
      ),
    [],
  );
  useEffect(() => () => bowl.dispose(), [bowl]);
  const ashes = useMemo(() => {
    const random = seededRandom("ashtray-ash");
    return Array.from({ length: 14 }, () => ({
      position: [(random() - 0.5) * 0.9, 0.14, (random() - 0.5) * 0.9] as [number, number, number],
      scale: [0.03 + random() * 0.04, 0.012 + random() * 0.015, 0.03 + random() * 0.04] as [number, number, number],
      rotation: [random() * 3, random() * 3, random() * 3] as [number, number, number],
    }));
  }, []);
  const smokeOrigin = useMemo(() => {
    const tipX = REST.x - CIGARETTE.inner * Math.cos(REST.tilt);
    const tipY = REST.y - CIGARETTE.inner * Math.sin(REST.tilt);
    return base.clone().add(new Vector3(tipX, tipY + 0.03, 0));
  }, [base]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breath = 0.75 + 0.25 * Math.sin(t * 1.3) * Math.sin(t * 0.47 + 1);
    if (ember.current) ember.current.emissiveIntensity = 2.2 * breath;
    if (glow.current) glow.current.intensity = 0.5 * breath;
  });

  const { ash: ashPart, ember: emberPart, paper: paperPart, filter: filterPart } = CIGARETTE_PARTS;
  const tube = (length: number, radius = CIGARETTE.radius) => <cylinderGeometry args={[radius, radius, length, 14]} />;

  return (
    <>
      <group position={base}>
        <mesh geometry={bowl} castShadow receiveShadow>
          <meshPhysicalMaterial {...worldShader} color="#2b2723" roughness={0.16} metalness={0.15} clearcoat={0.8} />
        </mesh>
        {ashes.map((piece, index) => (
          <mesh key={index} position={piece.position} rotation={piece.rotation} scale={piece.scale} receiveShadow>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial {...worldShader} color="#5f5a55" roughness={1} />
          </mesh>
        ))}
        <group position={[-0.3, 0.17, 0.25]} rotation={[0, 0.9, 0.12]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            {tube(0.26)}
            <meshStandardMaterial {...worldShader} color="#c08a4a" roughness={0.9} />
          </mesh>
          <mesh position={[-0.15, -0.01, 0]} rotation={[0, 0, Math.PI / 2 + 0.5]} castShadow>
            {tube(0.08, 0.05)}
            <meshStandardMaterial {...worldShader} color="#d8d4cc" roughness={0.9} />
          </mesh>
        </group>
        <group position={[REST.x, REST.y, 0]} rotation={[0, 0, REST.tilt]}>
          <mesh position={ashPart.position} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[CIGARETTE.radius * 0.98, CIGARETTE.radius * 1.06, ashPart.length, 7]} />
            <meshStandardMaterial {...worldShader} color="#9a958e" roughness={1} />
          </mesh>
          <mesh position={emberPart.position} rotation={[0, 0, Math.PI / 2]}>
            {tube(emberPart.length, CIGARETTE.radius * 1.02)}
            <meshStandardMaterial
              ref={ember}
              {...accentShader}
              color="#3a1408"
              emissive={EMBER_COLOR}
              emissiveIntensity={2}
            />
          </mesh>
          <mesh position={paperPart.position} rotation={[0, 0, Math.PI / 2]} castShadow>
            {tube(paperPart.length)}
            <meshStandardMaterial {...worldShader} color="#f2efe8" roughness={0.85} />
          </mesh>
          <mesh position={filterPart.position} rotation={[0, 0, Math.PI / 2]} castShadow>
            {tube(filterPart.length)}
            <meshStandardMaterial {...worldShader} color="#c08a4a" roughness={0.9} />
          </mesh>
          <pointLight
            ref={glow}
            position={[emberPart.position[0], 0.05, 0]}
            color={EMBER_COLOR}
            distance={1.4}
            decay={2}
          />
        </group>
      </group>
      <Smoke origin={smokeOrigin} />
    </>
  );
}
