"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BackSide,
  Box3,
  CylinderGeometry,
  DoubleSide,
  MathUtils,
  type MeshStandardMaterial,
  type Object3D,
  type SpotLight,
  Vector3,
} from "three";
import { playSwitchClick } from "@/audio/foley";
import type { Quality } from "../quality";
import { useLook, useWorldShader } from "../scene/look";
import { isTap } from "../scene/pointer";
import { InView } from "../scene/inView";
import { pointerCursor } from "./deskState";
import { DESK, onDesk, PROPS } from "./layout";

const SHADE = { radius: 0.62, length: 3.1, height: 3.6, forward: 0.3 };
const STEM_TOP = 3.75;
const LIGHT_INTENSITY = 90;
const SWITCH_SPEED = 18;
const CHAIN_LINKS = 14;
const CHAIN_STEP = 0.055;
const LIT = new Box3(
  new Vector3(DESK.minX, DESK.floor, DESK.back),
  new Vector3(DESK.maxX, DESK.top + STEM_TOP + 1, DESK.front),
).expandByScalar(1.5);

export function DeskLamp({ quality }: { quality: Quality }) {
  const worldShader = useWorldShader();
  const look = useLook();
  const [on, setOn] = useState(true);
  const light = useRef<SpotLight>(null);
  const aim = useRef<Object3D>(null);
  const glow = useRef<MeshStandardMaterial>(null);
  const bulb = useRef<MeshStandardMaterial>(null);
  const level = useRef(1);
  const shade = useMemo(() => {
    const geometry = new CylinderGeometry(SHADE.radius, SHADE.radius, SHADE.length, 48, 1, true, 0, Math.PI);
    geometry.rotateZ(Math.PI / 2);
    return geometry;
  }, []);
  useEffect(() => () => shade.dispose(), [shade]);
  const desk = useMemo(() => new InView(LIT), []);
  useEffect(() => {
    if (light.current && aim.current) light.current.target = aim.current;
  }, []);

  useFrame((state, delta) => {
    level.current = MathUtils.damp(level.current, on ? 1 : 0, SWITCH_SPEED, delta);
    if (light.current) {
      light.current.shadow.needsUpdate = desk.seenBy(state.camera);
      light.current.intensity = LIGHT_INTENSITY * level.current;
      light.current.color.copy(look.lampColor);
    }
    if (glow.current) {
      glow.current.emissive.copy(look.lampColor);
      glow.current.emissiveIntensity = 0.9 * level.current;
    }
    if (bulb.current) {
      bulb.current.emissive.copy(look.lampColor);
      bulb.current.emissiveIntensity = 3 * level.current;
    }
  });

  const toggle = (event: ThreeEvent<MouseEvent>) => {
    if (!isTap(event)) return;
    event.stopPropagation();
    playSwitchClick();
    setOn((value) => !value);
  };

  const brass = <meshStandardMaterial {...worldShader} color="#b08d57" metalness={1} roughness={0.32} />;
  const shadeY = SHADE.height;

  return (
    <group position={onDesk(PROPS.lamp.at)} rotation={[0, MathUtils.degToRad(PROPS.lamp.yaw), 0]} onClick={toggle} {...pointerCursor}>
      <RoundedBox args={[2.6, 0.22, 1.5]} radius={0.06} position={[0, 0.11, 0]} castShadow receiveShadow>
        {brass}
      </RoundedBox>
      <RoundedBox args={[2.0, 0.14, 1.1]} radius={0.05} position={[0, 0.29, 0]} castShadow receiveShadow>
        {brass}
      </RoundedBox>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.22, 24]} />
        {brass}
      </mesh>
      <mesh position={[0, (0.36 + STEM_TOP) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.085, 0.085, STEM_TOP - 0.36, 16]} />
        {brass}
      </mesh>
      <mesh position={[0, STEM_TOP, SHADE.forward / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, SHADE.forward + 0.2, 12]} />
        {brass}
      </mesh>
      <mesh position={[0, STEM_TOP + 0.12, 0]} castShadow>
        <sphereGeometry args={[0.13, 16, 12]} />
        {brass}
      </mesh>
      <group position={[0, shadeY, SHADE.forward]}>
        <mesh geometry={shade} castShadow>
          <meshPhysicalMaterial {...worldShader} color="#1d5a3a" roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} />
        </mesh>
        <mesh geometry={shade} scale={0.985}>
          <meshStandardMaterial ref={glow} {...worldShader} color="#efe6cf" side={BackSide} roughness={0.6} emissive={look.lampColor} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[(side * SHADE.length) / 2, 0, 0]} rotation={[0, side * (Math.PI / 2), 0]} castShadow>
            <circleGeometry args={[SHADE.radius + 0.02, 32, 0, Math.PI]} />
            <meshStandardMaterial {...worldShader} color="#b08d57" metalness={1} roughness={0.35} side={DoubleSide} />
          </mesh>
        ))}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[0, 0, side * SHADE.radius]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, SHADE.length, 8]} />
            {brass}
          </mesh>
        ))}
        <mesh position={[0, -0.12, 0]}>
          <sphereGeometry args={[0.22, 20, 16]} />
          <meshStandardMaterial ref={bulb} {...worldShader} color="#fff6e0" emissive={look.lampColor} />
        </mesh>
        {Array.from({ length: CHAIN_LINKS }, (_, index) => (
          <mesh key={index} position={[0.7, -index * CHAIN_STEP, SHADE.radius * 0.55]}>
            <sphereGeometry args={[0.022, 8, 6]} />
            {brass}
          </mesh>
        ))}
        <mesh position={[0.7, -CHAIN_LINKS * CHAIN_STEP - 0.08, SHADE.radius * 0.55]} castShadow>
          <cylinderGeometry args={[0.05, 0.035, 0.16, 12]} />
          {brass}
        </mesh>
        <spotLight
          ref={light}
          position={[0, -0.15, 0]}
          angle={1.05}
          penumbra={0.85}
          distance={20}
          decay={2}
          intensity={LIGHT_INTENSITY}
          castShadow={quality.tier === "high"}
          shadow-mapSize={[1024, 1024]}
          shadow-autoUpdate={false}
          shadow-bias={-0.0006}
          shadow-normalBias={0.02}
        />
        <object3D ref={aim} position={[0, -SHADE.height, 2]} />
      </group>
    </group>
  );
}
