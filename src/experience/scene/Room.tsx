"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { BOARD_SIZE } from "@/content/board";
import { paintCork, paintWall } from "../textures/procedural";
import { BOARD_FRAME as FRAME, BOARD_FRAME_DEPTH as FRAME_DEPTH, CORK_TILE, WALL_Z } from "./constants";

const repeating = (canvas: HTMLCanvasElement, repeatX: number, repeatY: number, srgb: boolean) => {
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  if (srgb) texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

export function Room({ textureSize }: { textureSize: number }) {
  const { width, height } = BOARD_SIZE;
  const cork = useMemo(() => {
    const canvas = paintCork(textureSize);
    return {
      map: repeating(canvas, width / CORK_TILE, height / CORK_TILE, true),
      bump: repeating(canvas, width / CORK_TILE, height / CORK_TILE, false),
    };
  }, [textureSize, width, height]);
  const wall = useMemo(() => repeating(paintWall(512), 6, 4, true), []);

  useEffect(
    () => () => {
      cork.map.dispose();
      cork.bump.dispose();
    },
    [cork],
  );
  useEffect(() => () => wall.dispose(), [wall]);

  const frameMaterial = <meshStandardMaterial color="#2c1a10" roughness={0.55} metalness={0.05} />;
  const sides: Array<{ position: [number, number, number]; size: [number, number, number] }> = [
    { position: [0, height / 2 + FRAME / 2, 0], size: [width + FRAME * 2, FRAME, FRAME_DEPTH] },
    { position: [0, -height / 2 - FRAME / 2, 0], size: [width + FRAME * 2, FRAME, FRAME_DEPTH] },
    { position: [-width / 2 - FRAME / 2, 0, 0], size: [FRAME, height, FRAME_DEPTH] },
    { position: [width / 2 + FRAME / 2, 0, 0], size: [FRAME, height, FRAME_DEPTH] },
  ];

  return (
    <group>
      <mesh position={[0, 0, WALL_Z]} receiveShadow>
        <planeGeometry args={[140, 80]} />
        <meshStandardMaterial map={wall} roughness={1} color="#8a7a66" />
      </mesh>
      <mesh receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={cork.map} bumpMap={cork.bump} bumpScale={2.2} roughness={0.96} color="#d8c2a6" />
      </mesh>
      {sides.map((side, index) => (
        <mesh key={index} position={side.position} castShadow receiveShadow>
          <boxGeometry args={side.size} />
          {frameMaterial}
        </mesh>
      ))}
    </group>
  );
}
