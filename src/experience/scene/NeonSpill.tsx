"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, Vector3, type Object3D, type SpotLight } from "three";
import { useRig } from "../camera/rig";
import { useReducedMotion } from "../useReducedMotion";
import { neonLevel } from "./neonLife";

const NEON = {
  color: "#ff2c3d",
  intensity: 200,
  referenceReach: 12,
  angle: 0.55,
  follow: 1.6,
};
const FROM = new Vector3(-0.8, -0.25, 0.55).normalize();
const AIM_SIDE = new Vector3(-0.42, -0.08, 0);

export function NeonSpill() {
  const rig = useRig();
  const still = useReducedMotion();
  const light = useRef<SpotLight>(null);
  const target = useRef<Object3D>(null);
  const motion = useRef({ reach: NEON.referenceReach, position: new Vector3(), aim: new Vector3(), desired: new Vector3() });

  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);

  useFrame((state, delta) => {
    const m = motion.current;
    const k = 1 - Math.exp(-delta * NEON.follow);
    m.reach = MathUtils.lerp(m.reach, state.camera.position.distanceTo(rig.target), k);
    m.aim.lerp(m.desired.copy(rig.target).addScaledVector(AIM_SIDE, m.reach), k);
    m.position.lerp(m.desired.copy(rig.target).addScaledVector(FROM, m.reach), k);
    target.current?.position.copy(m.aim);
    if (!light.current) return;
    light.current.position.copy(m.position);
    const level = still ? 1 : neonLevel(state.clock.elapsedTime);
    light.current.intensity = NEON.intensity * (m.reach / NEON.referenceReach) ** 2 * level;
  });

  return (
    <>
      <spotLight ref={light} color={NEON.color} intensity={0} angle={NEON.angle} penumbra={1} decay={2} distance={0} />
      <object3D ref={target} />
    </>
  );
}
