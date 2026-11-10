"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { CatmullRomCurve3, MathUtils, Vector3, type MeshStandardMaterial } from "three";
import { playKeyClunk } from "@/audio/foley";
import { TapeDeck, type TapeKey } from "@/audio/tape";
import { cassette } from "@/content/desk";
import type { Locale } from "@/content/types";
import { switchSoundOn } from "../hud/useAudioMute";
import { useAccentShader, useWorldShader } from "../scene/look";
import { useExperience } from "../state/store";
import { Cassette } from "./Cassette";
import { onDesk, PROPS } from "./layout";
import { counterReading, reelState } from "./reels";
import { KEY, KEYS_SPAN, TapeKeys } from "./TapeKeys";
import { useRecorderTextures } from "./useRecorderTextures";

const BODY = { width: 3.9, height: 0.95, depth: 2.3, radius: 0.1 };
const PLATE = { thickness: 0.03, inset: 0.1 };
const TOP = BODY.height + PLATE.thickness;
const BAY = { x: 0.95, z: -0.2, width: 1.8, depth: 1.3, wall: 0.06, height: 0.17 };
const KEYS_AT = { x: 0.95, z: 0.85 };
const GRILLE = { x: -0.97, z: -0.12, width: 1.7, depth: 1.6 };
const COUNTER = { x: -0.5, z: 0.86, width: 0.48, depth: 0.16 };
const LED = { x: -1.55, z: 0.86, glow: 2.6 };
const HANDLE_RADIUS = 0.035;

const handlePath = () => {
  const side = BODY.width / 2 + HANDLE_RADIUS;
  const bar = -(BODY.depth / 2) + 0.13;
  return new CatmullRomCurve3([
    new Vector3(-side, 0.62, -0.75),
    new Vector3(-side, TOP - 0.02, -0.92),
    new Vector3(-side + 0.12, TOP + 0.05, bar),
    new Vector3(side - 0.12, TOP + 0.05, bar),
    new Vector3(side, TOP - 0.02, -0.92),
    new Vector3(side, 0.62, -0.75),
  ]);
};

export function CassetteRecorder({ locale }: { locale: Locale }) {
  const worldShader = useWorldShader();
  const accentShader = useAccentShader();
  const textures = useRecorderTextures(locale);
  const [deck] = useState(() => new TapeDeck(cassette.recording, { repeat: true }));
  const led = useRef<MeshStandardMaterial>(null);
  const handle = useMemo(() => handlePath(), []);
  const entered = useExperience((state) => state.entered);
  const soundOn = useExperience((state) => state.soundOn);
  const started = useRef(false);
  useEffect(() => () => deck.dispose(), [deck]);

  useEffect(() => {
    if (soundOn) deck.prepare();
  }, [deck, soundOn]);

  useEffect(() => {
    if (!entered || !soundOn || started.current) return;
    started.current = true;
    deck.press("play");
  }, [deck, entered, soundOn]);

  useFrame((_, delta) => {
    if (deck.update(delta)) playKeyClunk(false);
    if (led.current) {
      led.current.emissiveIntensity = MathUtils.damp(led.current.emissiveIntensity, deck.speed !== 0 ? LED.glow : 0, 12, delta);
    }
    textures?.counter.show(counterReading(reelState(deck.progress, deck.duration).takeUpAngle));
  });

  const press = (key: TapeKey) => {
    if (key === "play") switchSoundOn();
    playKeyClunk(deck.press(key));
  };

  if (!textures) return null;

  const plastic = <meshStandardMaterial {...worldShader} color="#262523" roughness={0.55} />;
  const chrome = <meshStandardMaterial {...worldShader} color="#d0d0cb" metalness={1} roughness={0.25} />;

  return (
    <group
      position={onDesk(PROPS.recorder.at)}
      rotation={[0, MathUtils.degToRad(PROPS.recorder.yaw), 0]}
      onPointerEnter={() => deck.prepare()}
    >
      <RoundedBox args={[BODY.width, BODY.height, BODY.depth]} radius={BODY.radius} position={[0, BODY.height / 2, 0]} castShadow receiveShadow>
        {plastic}
      </RoundedBox>
      <mesh position={[0, BODY.height + PLATE.thickness / 2, 0]} receiveShadow>
        <boxGeometry args={[BODY.width - PLATE.inset * 2, PLATE.thickness, BODY.depth - PLATE.inset * 2]} />
        <meshStandardMaterial {...worldShader} color="#8f8f8a" metalness={0.65} roughness={0.42} />
      </mesh>

      <mesh position={[GRILLE.x, TOP + 0.001, GRILLE.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[GRILLE.width, GRILLE.depth]} />
        <meshStandardMaterial {...worldShader} map={textures.grille} bumpMap={textures.grille} bumpScale={0.6} metalness={0.6} roughness={0.4} />
      </mesh>

      <mesh position={[BAY.x, TOP + 0.002, BAY.z]}>
        <boxGeometry args={[BAY.width - BAY.wall * 2, 0.004, BAY.depth - BAY.wall * 2]} />
        <meshStandardMaterial {...worldShader} color="#121110" roughness={0.8} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`z${side}`} position={[BAY.x, TOP + BAY.height / 2, BAY.z + (side * (BAY.depth - BAY.wall)) / 2]} castShadow>
          <boxGeometry args={[BAY.width, BAY.height, BAY.wall]} />
          {plastic}
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`x${side}`} position={[BAY.x + (side * (BAY.width - BAY.wall)) / 2, TOP + BAY.height / 2, BAY.z]} castShadow>
          <boxGeometry args={[BAY.wall, BAY.height, BAY.depth - BAY.wall * 2]} />
          {plastic}
        </mesh>
      ))}
      <group position={[BAY.x, TOP, BAY.z]}>
        <Cassette face={textures.face} deck={deck} />
      </group>
      <mesh position={[BAY.x, TOP + BAY.height + 0.012, BAY.z]}>
        <boxGeometry args={[BAY.width, 0.024, BAY.depth]} />
        <meshPhysicalMaterial
          {...worldShader}
          color="#4d4842"
          transparent
          opacity={0.32}
          roughness={0.06}
          clearcoat={1}
          clearcoatRoughness={0.04}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[KEYS_AT.x, TOP + 0.004, KEYS_AT.z]}>
        <boxGeometry args={[KEYS_SPAN + 0.06, 0.008, KEY.length + 0.06]} />
        <meshStandardMaterial {...worldShader} color="#0e0e0d" roughness={0.9} />
      </mesh>
      <group position={[KEYS_AT.x, TOP, KEYS_AT.z]}>
        <TapeKeys deck={deck} symbols={textures.symbols} onPress={press} />
      </group>

      <mesh position={[COUNTER.x, TOP + 0.025, COUNTER.z]} castShadow>
        <boxGeometry args={[COUNTER.width + 0.08, 0.05, COUNTER.depth + 0.08]} />
        {plastic}
      </mesh>
      <mesh position={[COUNTER.x, TOP + 0.051, COUNTER.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[COUNTER.width, COUNTER.depth]} />
        <meshStandardMaterial {...worldShader} map={textures.counter.texture} roughness={0.3} />
      </mesh>

      <mesh position={[LED.x, TOP + 0.012, LED.z]}>
        <cylinderGeometry args={[0.045, 0.045, 0.024, 20]} />
        <meshStandardMaterial ref={led} {...accentShader} color="#5a120d" emissive="#ff2a14" emissiveIntensity={0} roughness={0.2} />
      </mesh>
      <mesh position={[LED.x, TOP + 0.006, LED.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.06, 0.014, 8, 24]} />
        {chrome}
      </mesh>

      <mesh position={[-0.95, BODY.height * 0.5, BODY.depth / 2 + 0.002]}>
        <planeGeometry args={[1.6, 0.25]} />
        <meshStandardMaterial {...worldShader} map={textures.brand} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, BODY.height * 0.82, BODY.depth / 2 + 0.004]}>
        <boxGeometry args={[BODY.width - BODY.radius * 2, 0.03, 0.01]} />
        {chrome}
      </mesh>

      <mesh castShadow>
        <tubeGeometry args={[handle, 64, HANDLE_RADIUS, 8, false]} />
        {chrome}
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (BODY.width / 2 + 0.02), 0.62, -0.75]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.05, 20]} />
          {chrome}
        </mesh>
      ))}
    </group>
  );
}
