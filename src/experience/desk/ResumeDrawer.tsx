"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useRef, useState } from "react";
import { CanvasTexture, MathUtils, SRGBColorSpace, type Group } from "three";
import { track, trackOnClick } from "@/analytics/track";
import { playDrawer } from "@/audio/foley";
import { pick } from "@/content/localize";
import { profile, resume } from "@/content/profile";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { font, type FontFamilies } from "../painters/fonts";
import { INK, MANILA } from "../painters/palette";
import { context2d, createCanvas } from "../painters/surface";
import { useWorldShader } from "../scene/look";
import { isTap } from "../scene/pointer";
import { useExperience } from "../state/store";
import { disposeTexture, useFontPainted } from "../textures/useFontPainted";
import { DrawerFront } from "./DrawerFront";
import { pointerCursor } from "./deskState";
import { DRAWER, drawerAnchor } from "./layout";

const SLIDE_SPEED = 7;
const WALL = 0.05;
const TRAY_HEIGHT = 0.62;
const FOLDER = { width: 3.4, depth: 1.75, z: -1.0 };

const paintFolder = (title: string, name: string, fonts: FontFamilies) => {
  const canvas = createCanvas(FOLDER.width * 200, FOLDER.depth * 200);
  const ctx = context2d(canvas);
  const { width, height } = canvas;
  ctx.fillStyle = MANILA;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(90, 60, 20, 0.12)";
  ctx.fillRect(0, 0, width, height * 0.08);
  ctx.fillStyle = "#efe8d6";
  ctx.fillRect(width * 0.3, height * 0.3, width * 0.4, height * 0.32);
  ctx.strokeStyle = "rgba(28, 26, 23, 0.5)";
  ctx.lineWidth = 3;
  ctx.strokeRect(width * 0.3, height * 0.3, width * 0.4, height * 0.32);
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font(600, height * 0.11, fonts.typewriter);
  ctx.fillText(title, width / 2, height * 0.41, width * 0.36);
  ctx.font = font(400, height * 0.07, fonts.typewriter);
  ctx.fillText(name, width / 2, height * 0.53, width * 0.36);
  ctx.save();
  ctx.translate(width * 0.82, height * 0.75);
  ctx.rotate(-0.2);
  ctx.strokeStyle = "rgba(170, 24, 28, 0.85)";
  ctx.fillStyle = "rgba(170, 24, 28, 0.85)";
  ctx.lineWidth = 5;
  ctx.font = font(600, height * 0.12, fonts.stamp);
  ctx.strokeRect(-height * 0.2, -height * 0.1, height * 0.4, height * 0.2);
  ctx.fillText("PDF", 0, 2);
  ctx.restore();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

const download = (href: string) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = "";
  link.click();
};

export function ResumeDrawer({ locale, material }: { locale: Locale; material: React.ReactNode }) {
  const worldShader = useWorldShader();
  const [open, setOpen] = useState(false);
  const slide = useRef<Group>(null);
  const paint = useCallback(
    (fonts: FontFamilies) => paintFolder(pick(ui.drawer.folder, locale), pick(profile.name, locale), fonts),
    [locale],
  );
  const label = useFontPainted(paint, disposeTexture);

  useFrame((_, delta) => {
    if (slide.current) slide.current.position.z = MathUtils.damp(slide.current.position.z, open ? DRAWER.travel : 0, SLIDE_SPEED, delta);
  });

  const toggle = (event: ThreeEvent<MouseEvent>) => {
    if (!isTap(event)) return;
    event.stopPropagation();
    if (useExperience.getState().soundOn) playDrawer(!open);
    setOpen(!open);
    if (open) return;
    track("drawer_opened", {});
    useExperience.getState().showToast({
      text: pick(ui.drawer.note, locale),
      link: {
        label: pick(ui.drawer.download, locale),
        href: pick(resume.href, locale),
        tracking: trackOnClick("resume_downloaded", { from: "drawer" }),
      },
    });
  };

  const takeFolder = (event: ThreeEvent<MouseEvent>) => {
    if (!isTap(event) || !open) return;
    event.stopPropagation();
    track("resume_downloaded", { from: "drawer" });
    download(pick(resume.href, locale));
  };

  const trayFloor = -DRAWER.height / 2 + WALL;

  return (
    <group position={drawerAnchor(1)}>
      <group ref={slide}>
        <group onClick={toggle} {...pointerCursor}>
          <DrawerFront material={material} />
        </group>
        <mesh position={[0, trayFloor, -DRAWER.depth / 2]} receiveShadow>
          <boxGeometry args={[DRAWER.width - 0.2, WALL, DRAWER.depth]} />
          {material}
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[(side * (DRAWER.width - 0.2 - WALL)) / 2, trayFloor + TRAY_HEIGHT / 2, -DRAWER.depth / 2]} castShadow>
            <boxGeometry args={[WALL, TRAY_HEIGHT, DRAWER.depth]} />
            {material}
          </mesh>
        ))}
        <mesh position={[0, trayFloor + TRAY_HEIGHT / 2, -DRAWER.depth]} castShadow>
          <boxGeometry args={[DRAWER.width - 0.2, TRAY_HEIGHT, WALL]} />
          {material}
        </mesh>
        <mesh position={[0.2, trayFloor + WALL / 2 + 0.03, FOLDER.z]} rotation={[0, 0.05, 0]} onClick={takeFolder} {...pointerCursor} castShadow receiveShadow>
          <boxGeometry args={[FOLDER.width, 0.04, FOLDER.depth]} />
          <meshStandardMaterial attach="material-0" {...worldShader} color={MANILA} roughness={0.85} />
          <meshStandardMaterial attach="material-1" {...worldShader} color={MANILA} roughness={0.85} />
          <meshStandardMaterial attach="material-2" {...worldShader} map={label} color="#ffffff" roughness={0.85} />
          <meshStandardMaterial attach="material-3" {...worldShader} color={MANILA} roughness={0.85} />
          <meshStandardMaterial attach="material-4" {...worldShader} color={MANILA} roughness={0.85} />
          <meshStandardMaterial attach="material-5" {...worldShader} color={MANILA} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}
