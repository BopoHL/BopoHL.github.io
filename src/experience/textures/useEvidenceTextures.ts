"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { CanvasTexture, NoColorSpace, SRGBColorSpace, type ColorSpace, type Texture } from "three";
import { portrait, profile } from "@/content/profile";
import type { Evidence, Locale, PhotoEvidence } from "@/content/types";
import { loadFonts, paintEvidence, paintRevealedMugshot, resolveFontFamilies } from "../painters";
import { useExperience } from "../state/store";

export interface EvidenceTextures {
  front: Map<string, Texture>;
  accent: Map<string, Texture>;
  revealedMugshot: Texture | null;
}

const EMPTY: EvidenceTextures = { front: new Map(), accent: new Map(), revealedMugshot: null };

const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export const useEvidenceTextures = (evidence: Evidence[], locale: Locale, pixelsPerUnit: number): EvidenceTextures => {
  const gl = useThree((state) => state.gl);
  const setPainted = useExperience((state) => state.setPainted);
  const [textures, setTextures] = useState<EvidenceTextures>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    let committed = false;
    const created: Texture[] = [];
    const anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());

    const toTexture = (canvas: HTMLCanvasElement, colorSpace: ColorSpace = SRGBColorSpace) => {
      const texture = new CanvasTexture(canvas);
      texture.colorSpace = colorSpace;
      texture.anisotropy = anisotropy;
      created.push(texture);
      return texture;
    };

    const paint = async () => {
      const fonts = resolveFontFamilies();
      await loadFonts(fonts);
      const front = new Map<string, Texture>();
      const accent = new Map<string, Texture>();
      let painted = 0;
      for (const item of evidence) {
        if (cancelled) return;
        const painting = await paintEvidence(item, locale, pixelsPerUnit, fonts);
        front.set(item.id, toTexture(painting.canvas));
        if (painting.accent) accent.set(item.id, toTexture(painting.accent, NoColorSpace));
        painted += 1;
        setPainted(painted, false);
        await yieldToBrowser();
      }
      const mugshot = evidence.find((item): item is PhotoEvidence => item.kind === "photo" && item.frame === "mugshot");
      const revealedMugshot = mugshot
        ? toTexture(await paintRevealedMugshot(mugshot, portrait, profile.name[locale], pixelsPerUnit, fonts))
        : null;
      if (cancelled) return;
      committed = true;
      setTextures({ front, accent, revealedMugshot });
      setPainted(painted, true);
    };

    paint();
    return () => {
      cancelled = true;
      if (!committed) created.forEach((texture) => texture.dispose());
    };
  }, [evidence, locale, pixelsPerUnit, gl, setPainted]);

  useEffect(
    () => () => {
      textures.front.forEach((texture) => texture.dispose());
      textures.accent.forEach((texture) => texture.dispose());
      textures.revealedMugshot?.dispose();
    },
    [textures],
  );

  return textures;
};
