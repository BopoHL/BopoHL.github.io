"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { useWorldShader } from "../scene/look";
import { paintWood } from "../textures/procedural";
import type { Locale } from "@/content/types";
import { DESK, DRAWER, drawerAnchor } from "./layout";
import { DrawerFront } from "./DrawerFront";
import { ResumeDrawer } from "./ResumeDrawer";

const WIDTH = DESK.maxX - DESK.minX;
const DEPTH = DESK.front - DESK.back;
const CENTER_X = (DESK.minX + DESK.maxX) / 2;
const CENTER_Z = (DESK.back + DESK.front) / 2;
const LEG_HEIGHT = DESK.top - DESK.thickness - DESK.floor;

const woodTexture = (canvas: HTMLCanvasElement, repeatX: number, repeatY: number, color: boolean): Texture => {
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  if (color) texture.colorSpace = SRGBColorSpace;
  return texture;
};

export function Desk({ locale }: { locale: Locale }) {
  const worldShader = useWorldShader();
  const wood = useMemo(() => {
    const canvas = paintWood(2048, 768);
    return { map: woodTexture(canvas, 1, 1, true), bump: woodTexture(canvas, 1, 1, false) };
  }, []);
  const floor = useMemo(() => {
    const canvas = paintWood(1024, 512, "floor-wood");
    return { map: woodTexture(canvas, 6, 10, true), bump: woodTexture(canvas, 6, 10, false) };
  }, []);
  useEffect(
    () => () => {
      for (const texture of [wood.map, wood.bump, floor.map, floor.bump]) texture.dispose();
    },
    [wood, floor],
  );

  const woodMaterial = (
    <meshStandardMaterial {...worldShader} map={wood.map} bumpMap={wood.bump} bumpScale={0.6} roughness={0.42} />
  );
  const apronY = DESK.top - DESK.thickness - DESK.apron / 2;
  const legX = [DESK.minX + DESK.leg, DESK.maxX - DESK.leg];
  const legZ = [DESK.back + DESK.leg, DESK.front - DESK.leg];

  return (
    <group>
      <mesh position={[CENTER_X, DESK.top - DESK.thickness / 2, CENTER_Z]} castShadow receiveShadow>
        <boxGeometry args={[WIDTH, DESK.thickness, DEPTH]} />
        {woodMaterial}
      </mesh>
      <mesh position={[CENTER_X, apronY, DESK.front - DRAWER.inset]} castShadow receiveShadow>
        <boxGeometry args={[WIDTH - DRAWER.inset * 2, DESK.apron, 0.3]} />
        {woodMaterial}
      </mesh>
      <group position={drawerAnchor(-1)}>
        <DrawerFront material={woodMaterial} />
      </group>
      {legX.flatMap((x) =>
        legZ.map((z) => (
          <mesh key={`${x}:${z}`} position={[x, DESK.floor + LEG_HEIGHT / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[DESK.leg, LEG_HEIGHT, DESK.leg]} />
            {woodMaterial}
          </mesh>
        )),
      )}
      <ResumeDrawer locale={locale} material={woodMaterial} />
      <mesh position={[0, DESK.floor, 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[140, 60]} />
        <meshStandardMaterial {...worldShader} map={floor.map} bumpMap={floor.bump} bumpScale={0.4} roughness={0.8} color="#6b5a4c" />
      </mesh>
    </group>
  );
}
