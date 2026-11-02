"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { CatmullRomCurve3, DoubleSide, MathUtils, Vector3, type Group, type MeshStandardMaterial, type Object3D } from "three";
import { FanHum } from "@/audio/fanHum";
import { playSwitchClick } from "@/audio/foley";
import { useWorldShader } from "../scene/look";
import { isTap } from "../scene/pointer";
import { pointerCursor, useDesk } from "./deskState";
import { BADGE, createBase, createBlades, createCage, createMotor, FAN } from "./fanModel";
import { DESK, onDesk, PROPS } from "./layout";

const SCALE = 0.85;
const NECK = { bottom: 0.4, top: 1.8, radius: 0.085 };
const PIVOT_HEIGHT = 1.86;
const HEAD_LIFT = 0.5;
const MOTOR_CENTER = -0.45;
const TILT = MathUtils.degToRad(5);
const MAX_SPIN = 22;
const SPIN_UP = 1.1;
const SPIN_DOWN = 0.42;
const SWING = { amplitude: MathUtils.degToRad(32), period: 14 };
const BUTTON = { at: [0, 0.3, 0.78] as [number, number, number], slope: MathUtils.degToRad(17), travel: 0.035 };
const CORD_RADIUS = 0.035;

const ENAMEL = "#a9b9a4";
const CHROME = { color: "#d6d6d2", metalness: 1, roughness: 0.28 } as const;
const BRASS = { color: "#a8844f", metalness: 0.85, roughness: 0.45 } as const;

const cordPath = () => {
  const yaw = MathUtils.degToRad(PROPS.fan.yaw);
  const [x, y, z] = onDesk(PROPS.fan.at, CORD_RADIUS);
  const local = (lx: number, lz: number) => new Vector3(x + (lx * Math.cos(yaw) + lz * Math.sin(yaw)) * SCALE, y, z + (-lx * Math.sin(yaw) + lz * Math.cos(yaw)) * SCALE);
  const start = local(0, -0.95).setY(y + 0.06);
  const edge = DESK.back;
  return new CatmullRomCurve3([
    start,
    local(0.15, -1.6),
    new Vector3(start.x + 1.2, y, (start.z + edge) / 2),
    new Vector3(start.x + 1.6, y, edge + 0.15),
    new Vector3(start.x + 1.7, y - 0.25, edge - 0.08),
    new Vector3(start.x + 1.75, y - 3, edge - 0.15),
  ]);
};

export function DeskFan() {
  const desk = useDesk();
  const worldShader = useWorldShader();
  const [on, setOn] = useState(false);
  const [hum] = useState(() => new FanHum());
  const swivel = useRef<Group>(null);
  const rotor = useRef<Group>(null);
  const button = useRef<Group>(null);
  const outlet = useRef<Object3D>(null);
  const bladeMaterial = useRef<MeshStandardMaterial>(null);
  const blurMaterial = useRef<MeshStandardMaterial>(null);
  const motion = useRef({ speed: 0, angle: 0, phase: 0 });
  const scratch = useMemo(() => ({ origin: new Vector3(), forward: new Vector3() }), []);

  const geometry = useMemo(
    () => ({ base: createBase(), motor: createMotor(), cage: createCage(), blades: createBlades(), cord: cordPath() }),
    [],
  );
  useEffect(
    () => () => {
      geometry.base.dispose();
      geometry.motor.dispose();
      geometry.cage.dispose();
      geometry.blades.dispose();
    },
    [geometry],
  );
  useEffect(() => () => hum.stop(), [hum]);

  useFrame((_, delta) => {
    const m = motion.current;
    m.speed = MathUtils.damp(m.speed, on ? MAX_SPIN : 0, on ? SPIN_UP : SPIN_DOWN, delta);
    if (!on && m.speed < 0.02) m.speed = 0;
    const spin = m.speed / MAX_SPIN;
    m.angle = (m.angle + m.speed * delta) % (Math.PI * 2);
    m.phase += ((Math.PI * 2) / SWING.period) * spin * delta;

    if (rotor.current) rotor.current.rotation.z = m.angle;
    if (swivel.current) swivel.current.rotation.y = SWING.amplitude * Math.sin(m.phase);
    if (button.current) button.current.position.y = on ? -BUTTON.travel : 0;
    if (bladeMaterial.current) bladeMaterial.current.opacity = 1 - 0.65 * MathUtils.smoothstep(spin, 0.2, 0.8);
    if (blurMaterial.current) blurMaterial.current.opacity = 0.32 * MathUtils.smoothstep(spin, 0.15, 0.85);

    if (outlet.current) {
      outlet.current.getWorldPosition(scratch.origin);
      outlet.current.getWorldDirection(scratch.forward);
      desk.blowFrom(scratch.origin, scratch.forward, spin);
    }
    hum.update(spin, on, delta);
  });

  const toggle = (event: ThreeEvent<MouseEvent>) => {
    if (!isTap(event)) return;
    event.stopPropagation();
    playSwitchClick();
    setOn((value) => !value);
  };

  const enamel = <meshStandardMaterial {...worldShader} color={ENAMEL} roughness={0.38} metalness={0.05} />;
  const chrome = <meshStandardMaterial {...worldShader} {...CHROME} />;

  return (
    <>
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[geometry.cord, 64, CORD_RADIUS, 6, false]} />
        <meshStandardMaterial {...worldShader} color="#1b1a18" roughness={0.7} />
      </mesh>
      <group
        position={onDesk(PROPS.fan.at)}
        rotation={[0, MathUtils.degToRad(PROPS.fan.yaw), 0]}
        scale={SCALE}
        onClick={toggle}
        {...pointerCursor}
      >
        <mesh geometry={geometry.base} castShadow receiveShadow>
          {enamel}
        </mesh>
        <group position={BUTTON.at} rotation={[BUTTON.slope, 0, 0]}>
          <group ref={button}>
            <mesh position={[0, 0.03, 0]} castShadow>
              <cylinderGeometry args={[0.11, 0.12, 0.08, 24]} />
              <meshStandardMaterial {...worldShader} color="#2a2724" roughness={0.45} />
            </mesh>
          </group>
          <mesh position={[0, -0.005, 0]}>
            <torusGeometry args={[0.135, 0.018, 8, 32]} />
            {chrome}
          </mesh>
        </group>
        <mesh position={[0, (NECK.bottom + NECK.top) / 2, 0]} castShadow>
          <cylinderGeometry args={[NECK.radius, NECK.radius * 1.2, NECK.top - NECK.bottom, 20]} />
          {chrome}
        </mesh>
        <group ref={swivel} position={[0, PIVOT_HEIGHT, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.13, 20, 14]} />
            {chrome}
          </mesh>
          <group rotation={[TILT, 0, 0]}>
            <mesh position={[0, HEAD_LIFT / 2, 0]} castShadow>
              <boxGeometry args={[0.14, HEAD_LIFT, 0.32]} />
              {enamel}
            </mesh>
            <group position={[0, HEAD_LIFT, -MOTOR_CENTER]}>
              <mesh geometry={geometry.motor} castShadow>
                {enamel}
              </mesh>
              <mesh position={[0, FAN.motorRadius - 0.02, -0.72]} castShadow>
                <cylinderGeometry args={[0.06, 0.075, 0.2, 16]} />
                {chrome}
              </mesh>
              <mesh position={[0, 0, (FAN.cageCenter - 0.12) / 2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.035, FAN.cageCenter, 10]} />
                {chrome}
              </mesh>
              <group ref={rotor} position={[0, 0, FAN.cageCenter]}>
                <mesh geometry={geometry.blades} castShadow>
                  <meshStandardMaterial
                    ref={bladeMaterial}
                    {...worldShader}
                    {...BRASS}
                    side={DoubleSide}
                    transparent
                  />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[FAN.hubRadius, FAN.hubRadius, 0.16, 24]} />
                  {chrome}
                </mesh>
                <mesh position={[0, 0, 0.08]} scale={[1, 1, 0.55]}>
                  <sphereGeometry args={[FAN.hubRadius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  {chrome}
                </mesh>
              </group>
              <mesh position={[0, 0, FAN.cageCenter]}>
                <ringGeometry args={[FAN.hubRadius, FAN.bladeRadius, 64]} />
                <meshStandardMaterial
                  ref={blurMaterial}
                  {...worldShader}
                  {...BRASS}
                  roughness={0.6}
                  side={DoubleSide}
                  transparent
                  opacity={0}
                  depthWrite={false}
                />
              </mesh>
              <mesh geometry={geometry.cage} castShadow>
                {chrome}
              </mesh>
              <mesh position={[0, 0, BADGE.z + 0.012]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[BADGE.radius, BADGE.radius, 0.02, 32]} />
                {enamel}
              </mesh>
              <object3D ref={outlet} position={[0, 0, BADGE.z]} />
              <mesh position={[0, 0, FAN.cageCenter - 0.2]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[FAN.cageRadius, FAN.cageRadius, 1.6, 24, 1]} />
                <meshBasicMaterial visible={false} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </>
  );
}
