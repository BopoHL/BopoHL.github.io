"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { CatmullRomCurve3, MathUtils, Vector3, type Group } from "three";
import { playDialPulse } from "@/audio/foley";
import { pick } from "@/content/localize";
import { contacts } from "@/content/profile";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import type { FontFamilies } from "../painters/fonts";
import { useWorldShader } from "../scene/look";
import { isTap } from "../scene/pointer";
import { disposeTexture, useFontPainted } from "../textures/useFontPainted";
import { useExperience } from "../state/store";
import { pointerCursor } from "./deskState";
import { onDesk, PROPS } from "./layout";
import { DIAL, Dialer } from "./phoneDial";
import { holeAngle, HOLE_RADIUS, paintDialPlate } from "./phoneTextures";

const DIAL_RADIUS = 0.95;
const DIAL_TILT = -0.62;
const NUMBER = "404";
const telegram = contacts.find((contact) => contact.id === "telegram");

const coiledCord = () => {
  const from = new Vector3(-1.2, 1.25, -0.2);
  const to = new Vector3(-1.5, 0.35, 0.4);
  const turns = 22;
  const points = Array.from({ length: turns * 10 + 1 }, (_, i) => {
    const t = i / (turns * 10);
    const sag = Math.sin(t * Math.PI) * 0.35;
    const angle = t * turns * Math.PI * 2;
    return from
      .clone()
      .lerp(to, t)
      .add(new Vector3(-0.25 * Math.sin(t * Math.PI) + Math.cos(angle) * 0.06, -sag + Math.sin(angle) * 0.06, 0));
  });
  return new CatmullRomCurve3(points);
};

const paintPlate = (fonts: FontFamilies) => paintDialPlate(["TELEGRAM", telegram?.value ?? ""], fonts);

export function RotaryPhone({ locale }: { locale: Locale }) {
  const worldShader = useWorldShader();
  const plate = useFontPainted(paintPlate, disposeTexture);
  const [dialer] = useState(() => new Dialer());
  const wheel = useRef<Group>(null);
  const cord = useMemo(() => coiledCord(), []);

  useFrame((_, delta) => {
    const pulses = dialer.update(delta);
    const { soundOn } = useExperience.getState();
    if (soundOn) for (let i = 0; i < Math.min(pulses, 2); i++) playDialPulse();
    if (wheel.current) wheel.current.rotation.z = -dialer.angle;
  });

  const call = (event: ThreeEvent<MouseEvent>) => {
    if (!isTap(event)) return;
    event.stopPropagation();
    if (!dialer.dial(NUMBER) || !telegram) return;
    useExperience.getState().showToast({
      text: `${pick(ui.phone.dialing, locale)} ${telegram.value}`,
      link: { label: pick(ui.phone.open, locale), href: telegram.href },
    });
  };

  const bakelite = <meshPhysicalMaterial {...worldShader} color="#121110" roughness={0.22} clearcoat={1} clearcoatRoughness={0.1} />;
  const chrome = <meshStandardMaterial {...worldShader} color="#d6d6d1" metalness={1} roughness={0.2} />;

  return (
    <group position={onDesk(PROPS.phone.at)} rotation={[0, MathUtils.degToRad(PROPS.phone.yaw), 0]} onClick={call} {...pointerCursor}>
      <RoundedBox args={[2.7, 0.85, 2.9]} radius={0.3} position={[0, 0.425, 0]} castShadow receiveShadow>
        {bakelite}
      </RoundedBox>
      <RoundedBox args={[2.2, 0.55, 1.7]} radius={0.24} position={[0, 1.0, -0.45]} castShadow receiveShadow>
        {bakelite}
      </RoundedBox>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.95, 1.33, -0.45]} castShadow>
          <boxGeometry args={[0.18, 0.16, 0.42]} />
          {bakelite}
        </mesh>
      ))}

      <group position={[0, 1.55, -0.45]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.16, 2.1, 6, 16]} />
          {bakelite}
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 1.2, -0.12, 0]} castShadow>
            <cylinderGeometry args={[side < 0 ? 0.36 : 0.32, side < 0 ? 0.3 : 0.27, 0.36, 28]} />
            {bakelite}
          </mesh>
        ))}
      </group>

      <mesh castShadow>
        <tubeGeometry args={[cord, 480, 0.022, 6, false]} />
        {bakelite}
      </mesh>

      <group position={[0, 0.78, 0.92]} rotation={[DIAL_TILT, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.03]} castShadow>
          <cylinderGeometry args={[DIAL_RADIUS + 0.05, DIAL_RADIUS + 0.08, 0.08, 40]} />
          {bakelite}
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <circleGeometry args={[DIAL_RADIUS, 48]} />
          <meshStandardMaterial {...worldShader} map={plate} color="#ffffff" roughness={0.5} />
        </mesh>
        <group ref={wheel} position={[0, 0, 0.05]}>
          <mesh>
            <ringGeometry args={[DIAL_RADIUS * 0.38, DIAL_RADIUS * 0.97, 48]} />
            <meshPhysicalMaterial {...worldShader} color="#ffffff" transparent opacity={0.12} roughness={0.05} />
          </mesh>
          {Array.from({ length: 10 }, (_, digit) => {
            const angle = holeAngle(digit);
            return (
              <mesh key={digit} position={[Math.cos(angle) * DIAL_RADIUS * HOLE_RADIUS, Math.sin(angle) * DIAL_RADIUS * HOLE_RADIUS, 0]}>
                <torusGeometry args={[0.105, 0.016, 8, 24]} />
                {chrome}
              </mesh>
            );
          })}
          <mesh position={[0, 0, 0.01]}>
            <ringGeometry args={[DIAL_RADIUS * 0.36, DIAL_RADIUS * 0.39, 48]} />
            {chrome}
          </mesh>
        </group>
        <mesh position={[Math.cos(DIAL.stop) * DIAL_RADIUS * 0.86, Math.sin(DIAL.stop) * DIAL_RADIUS * 0.86, 0.1]} castShadow>
          <boxGeometry args={[0.06, 0.06, 0.16]} />
          {chrome}
        </mesh>
      </group>
    </group>
  );
}
