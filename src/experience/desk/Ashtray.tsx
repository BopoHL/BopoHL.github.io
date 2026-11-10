"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  MathUtils,
  PMREMGenerator,
  SRGBColorSpace,
  Vector3,
  type MeshStandardMaterial,
  type PointLight,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Quality } from "../quality";
import { useAccentShader, useWorldShader } from "../scene/look";
import { ashBedHeight, createAshBed, createGlassAshtray, paintAsh, pointAlong, restPose } from "./ashtrayModel";
import {
  CIGARETTE_RADIUS,
  createCigarette,
  createEmberBand,
  paintCigarette,
  paintEmber,
  startOf,
  type CigaretteSpec,
} from "./cigaretteModel";
import { onDesk, PROPS } from "./layout";
import { Smoke } from "./Smoke";

const ASH_SEED = 404;
const UP = new Vector3(0, 1, 0);
const EMBER_COLOR = "#ff5a1a";
const GLASS: Record<Quality["tier"], { color: string; opacity: number; envMapIntensity: number }> = {
  high: { color: "#28302c", opacity: 0.22, envMapIntensity: 1.1 },
  low: { color: "#1d201e", opacity: 0.42, envMapIntensity: 0.9 },
};

const SMOULDERING: CigaretteSpec = {
  seed: "smouldering",
  sections: [
    { kind: "filter", length: 0.31 },
    { kind: "paper", length: 0.3 },
    { kind: "char", length: 0.022 },
    { kind: "ember", length: 0.016 },
    { kind: "ash", length: 0.27 },
  ],
};

const BUTTS: Array<{ spec: CigaretteSpec; at: [number, number]; yaw: number; roll: number }> = [
  {
    spec: {
      seed: "butt-a",
      sections: [
        { kind: "filter", length: 0.31 },
        { kind: "paper", length: 0.06 },
        { kind: "char", length: 0.035 },
      ],
      crush: { from: 0.3, bend: 1.1, flatten: 0.6 },
    },
    at: [-0.12, 0.18],
    yaw: 2.4,
    roll: 0.3,
  },
  {
    spec: {
      seed: "butt-b",
      sections: [
        { kind: "filter", length: 0.31 },
        { kind: "paper", length: 0.1 },
        { kind: "char", length: 0.03 },
      ],
      crush: { from: 0.33, bend: -0.8, flatten: 0.5 },
    },
    at: [0.05, -0.2],
    yaw: -0.6,
    roll: -0.2,
  },
];

const toTexture = (canvas: HTMLCanvasElement) => {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

const useGlassEnvironment = () => {
  const gl = useThree((state) => state.gl);
  const environment = useMemo(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const texture = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    return texture;
  }, [gl]);
  useEffect(() => () => environment.dispose(), [environment]);
  return environment;
};

const useCigaretteParts = () => {
  const parts = useMemo(
    () => ({
      glass: createGlassAshtray(),
      ash: { geometry: createAshBed(ASH_SEED), map: toTexture(paintAsh("ashtray-bed")) },
      cigarette: { geometry: createCigarette(SMOULDERING), map: toTexture(paintCigarette(SMOULDERING)) },
      ember: { geometry: createEmberBand(SMOULDERING), map: toTexture(paintEmber()) },
      butts: BUTTS.map((butt) => ({ ...butt, geometry: createCigarette(butt.spec), map: toTexture(paintCigarette(butt.spec)) })),
    }),
    [],
  );
  useEffect(
    () => () => {
      const pieces = [parts.ash, parts.cigarette, parts.ember, ...parts.butts];
      parts.glass.dispose();
      for (const piece of pieces) {
        piece.geometry.dispose();
        piece.map.dispose();
      }
    },
    [parts],
  );
  return parts;
};

export function Ashtray({ quality }: { quality: Quality }) {
  const worldShader = useWorldShader();
  const accentShader = useAccentShader();
  const environment = useGlassEnvironment();
  const parts = useCigaretteParts();
  const ember = useRef<MeshStandardMaterial>(null);
  const glow = useRef<PointLight>(null);
  const base = useMemo(() => new Vector3(...onDesk(PROPS.ashtray.at)), []);
  const pose = useMemo(() => restPose(), []);
  const emberAt = useMemo(() => pointAlong(pose, startOf(SMOULDERING, "ember") + 0.01), [pose]);
  const smokeOrigin = useMemo(
    () =>
      emberAt
        .clone()
        .multiplyScalar(PROPS.ashtray.scale)
        .applyAxisAngle(UP, MathUtils.degToRad(PROPS.ashtray.yaw))
        .add(base)
        .add(new Vector3(0, CIGARETTE_RADIUS * 0.9, 0)),
    [base, emberAt],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breath = 0.72 + 0.28 * Math.sin(t * 1.3) * Math.sin(t * 0.47 + 1);
    if (ember.current) ember.current.emissiveIntensity = 3.2 * breath;
    if (glow.current) glow.current.intensity = 0.45 * breath;
  });

  const glass = GLASS[quality.tier];

  return (
    <>
      <group position={base} rotation={[0, MathUtils.degToRad(PROPS.ashtray.yaw), 0]} scale={PROPS.ashtray.scale}>
        <mesh geometry={parts.glass} receiveShadow>
          <meshPhysicalMaterial
            {...worldShader}
            color={glass.color}
            envMap={environment}
            envMapIntensity={glass.envMapIntensity}
            roughness={0.04}
            clearcoat={1}
            clearcoatRoughness={0.03}
            transparent
            opacity={glass.opacity}
            depthWrite={false}
          />
        </mesh>
        <mesh geometry={parts.ash.geometry} receiveShadow>
          <meshStandardMaterial {...worldShader} map={parts.ash.map} vertexColors roughness={1} />
        </mesh>
        {parts.butts.map(({ geometry, map, at: [x, z], yaw, roll }, index) => (
          <group key={index} position={[x, ashBedHeight(x, z, ASH_SEED) + CIGARETTE_RADIUS * 0.55, z]} rotation={[roll, yaw, 0]}>
            <mesh geometry={geometry} position={[-0.2, 0, 0]} castShadow receiveShadow>
              <meshStandardMaterial {...worldShader} map={map} roughness={0.85} />
            </mesh>
          </group>
        ))}
        <group position={pose.position} rotation={[0, pose.yaw, 0]}>
          <group rotation={[0, 0, -pose.tilt]}>
            <group position={[-pose.contact, 0, 0]}>
              <mesh geometry={parts.cigarette.geometry} castShadow receiveShadow>
                <meshStandardMaterial {...worldShader} map={parts.cigarette.map} roughness={0.8} />
              </mesh>
              <mesh geometry={parts.ember.geometry}>
                <meshStandardMaterial
                  ref={ember}
                  {...accentShader}
                  color="#1b0c07"
                  map={parts.ember.map}
                  emissive={EMBER_COLOR}
                  emissiveMap={parts.ember.map}
                  emissiveIntensity={3}
                  alphaTest={0.25}
                  roughness={0.9}
                />
              </mesh>
            </group>
          </group>
        </group>
        <pointLight ref={glow} position={emberAt} color={EMBER_COLOR} distance={1.2} decay={2} />
      </group>
      <Smoke origin={smokeOrigin} />
    </>
  );
}
