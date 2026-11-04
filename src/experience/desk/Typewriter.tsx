"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { CatmullRomCurve3, DoubleSide, MathUtils, PlaneGeometry, Vector3, type Group, type Texture } from "three";
import { pick } from "@/content/localize";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import type { FontFamilies } from "../painters/fonts";
import { useWorldShader } from "../scene/look";
import { isTap } from "../scene/pointer";
import { useFontPainted } from "../textures/useFontPainted";
import { useExperience } from "../state/store";
import { pointerCursor } from "./deskState";
import { onDesk, PROPS } from "./layout";
import { StatementSheet, type SheetText } from "./statementSheet";
import { createCapGeometry, keyIndexFor, keySpots, paintKeyAtlas, TYPEWRITER } from "./typewriterModel";

const KEY_TRAVEL = 0.07;
const KEY_RETURN = 18;
const SPACE_INDEX = -1;
const PAPER_BEND = 0.35;

const createPaper = () => {
  const { width, height } = TYPEWRITER.paper;
  const geometry = new PlaneGeometry(width, height, 1, 16);
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    const t = (position.getY(i) + height / 2) / height;
    position.setZ(i, -PAPER_BEND * t * t);
  }
  geometry.translate(0, height / 2, 0);
  geometry.computeVertexNormals();
  return geometry;
};

const returnLever = () =>
  new CatmullRomCurve3([
    new Vector3(-1.95, 0, 0),
    new Vector3(-2.15, 0.12, 0.2),
    new Vector3(-2.3, 0.18, 0.55),
    new Vector3(-2.25, 0.2, 0.85),
  ]);

interface TypewriterTextures {
  atlas: Texture;
  sheet: StatementSheet;
}

const disposeTextures = ({ atlas, sheet }: TypewriterTextures) => {
  atlas.dispose();
  sheet.dispose();
};

export function Typewriter({ locale }: { locale: Locale }) {
  const worldShader = useWorldShader();
  const spots = useMemo(() => keySpots(locale), [locale]);
  const paint = useCallback(
    (fonts: FontFamilies): TypewriterTextures => ({ atlas: paintKeyAtlas(spots, fonts), sheet: new StatementSheet(fonts) }),
    [spots],
  );
  const textures = useFontPainted(paint, disposeTextures);
  const caps = useMemo(() => spots.map((spot) => createCapGeometry(spot.cell)), [spots]);
  const paper = useMemo(() => createPaper(), []);
  const lever = useMemo(() => returnLever(), []);
  useEffect(
    () => () => {
      for (const cap of caps) cap.dispose();
    },
    [caps],
  );
  useEffect(() => () => paper.dispose(), [paper]);
  const keys = useRef<Array<Group | null>>([]);
  const spaceBar = useRef<Group>(null);
  const struck = useRef({ serial: 0, index: null as number | null, depth: 0 });

  useFrame((_, delta) => {
    const state = useExperience.getState();
    const { statement, statementFiled, keystroke } = state;
    if (textures) {
      const sheet: SheetText = {
        heading: pick(ui.statement.sheetHeading, locale),
        message: statement.message,
        placeholder: pick(ui.statement.sheetPlaceholder, locale),
        signature: statement.contact ? `${statement.name || "—"} · ${statement.contact}` : "",
        stamp: statementFiled ? pick(ui.statement.stamp, locale) : "",
      };
      textures.sheet.show(sheet);
    }
    const strike = struck.current;
    if (keystroke.serial !== strike.serial) {
      strike.serial = keystroke.serial;
      strike.index = keystroke.char === " " ? SPACE_INDEX : (keyIndexFor(spots, keystroke.char) ?? Math.floor(Math.random() * spots.length));
      strike.depth = KEY_TRAVEL;
    }
    strike.depth = MathUtils.damp(strike.depth, 0, KEY_RETURN, delta);
    keys.current.forEach((key, index) => {
      if (key) key.position.y = strike.index === index ? -strike.depth : 0;
    });
    if (spaceBar.current) spaceBar.current.position.y = strike.index === SPACE_INDEX ? -strike.depth : 0;
  });

  const open = (event: ThreeEvent<MouseEvent>) => {
    if (!isTap(event)) return;
    event.stopPropagation();
    useExperience.getState().openStatement(true);
  };

  const enamel = <meshPhysicalMaterial {...worldShader} color="#141312" roughness={0.28} clearcoat={0.8} clearcoatRoughness={0.15} />;
  const chrome = <meshStandardMaterial {...worldShader} color="#d0d0cb" metalness={1} roughness={0.22} />;
  const rubber = <meshStandardMaterial {...worldShader} color="#0c0b0b" roughness={0.75} />;
  const { platen } = TYPEWRITER;

  return (
    <group
      position={onDesk(PROPS.typewriter.at)}
      rotation={[0, MathUtils.degToRad(PROPS.typewriter.yaw), 0]}
      onClick={open}
      {...pointerCursor}
    >
      <RoundedBox args={[4.3, 1.1, 1.9]} radius={0.12} position={[0, 0.55, -0.95]} castShadow receiveShadow>
        {enamel}
      </RoundedBox>
      <RoundedBox args={[4.1, 0.5, 2.0]} radius={0.1} position={[0, 0.3, 0.85]} rotation={[0.14, 0, 0]} castShadow receiveShadow>
        {enamel}
      </RoundedBox>
      <mesh position={[0, 0.2, 1.86]} castShadow>
        <boxGeometry args={[3.9, 0.06, 0.06]} />
        {chrome}
      </mesh>

      {spots.map((spot, index) => (
        <group
          key={spot.char}
          ref={(group) => {
            keys.current[index] = group;
          }}
        >
          <group position={spot.position}>
            <mesh position={[0, -0.12, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.24, 6]} />
              {chrome}
            </mesh>
            <mesh castShadow>
              <cylinderGeometry args={[TYPEWRITER.capRadius, TYPEWRITER.capRadius * 0.95, 0.05, 28]} />
              {chrome}
            </mesh>
            <mesh geometry={caps[index]} position={[0, 0.026, 0]}>
              <meshPhysicalMaterial {...worldShader} map={textures?.atlas ?? null} color="#ffffff" roughness={0.2} clearcoat={1} />
            </mesh>
          </group>
        </group>
      ))}
      <group ref={spaceBar}>
        <mesh position={[0, TYPEWRITER.baseHeight + 0.08, TYPEWRITER.frontRow + 0.36]} castShadow>
          <boxGeometry args={[2.4, 0.06, 0.14]} />
          {chrome}
        </mesh>
      </group>

      <group position={[0, platen.y, platen.z]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[platen.radius, platen.radius, platen.length, 32]} />
          {rubber}
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[(side * (platen.length + 0.2)) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.2, 24]} />
            {rubber}
          </mesh>
        ))}
        <mesh position={[0, -0.32, 0.05]} castShadow>
          <boxGeometry args={[4.4, 0.12, 0.7]} />
          {enamel}
        </mesh>
        <mesh position={[0, 0.18, 0.3]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 3.0, 8]} />
          {chrome}
        </mesh>
        <mesh>
          <tubeGeometry args={[lever, 24, 0.03, 8, false]} />
          {chrome}
        </mesh>
        <group position={[0, platen.radius * 0.6, -0.12]} rotation={[-0.12, 0, 0]}>
          <mesh geometry={paper} castShadow receiveShadow>
            <meshStandardMaterial {...worldShader} map={textures?.sheet.texture ?? null} color="#ffffff" roughness={0.9} side={DoubleSide} />
          </mesh>
        </group>
      </group>

      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.35, 1.17, -0.15]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.12, 24]} />
          <meshStandardMaterial {...worldShader} color="#2a2624" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
