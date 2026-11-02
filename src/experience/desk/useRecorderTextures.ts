"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { CanvasTexture, SRGBColorSpace, type Texture } from "three";
import type { TapeKey } from "@/audio/tape";
import { cassette } from "@/content/desk";
import { pick } from "@/content/localize";
import type { Locale } from "@/content/types";
import { loadFonts, resolveFontFamilies } from "../painters/fonts";
import { CounterDisplay, paintBrandPlate, paintCassetteFace, paintGrille, paintKeySymbol } from "./recorderTextures";

export interface RecorderTextures {
  face: Texture;
  grille: Texture;
  brand: Texture;
  symbols: Record<TapeKey, Texture>;
  counter: CounterDisplay;
}

const SYMBOL_COLOR: Record<TapeKey, string> = {
  record: "#f1ece2",
  rewind: "#1a1a19",
  play: "#1a1a19",
  forward: "#1a1a19",
  stop: "#1a1a19",
  pause: "#1a1a19",
};

export const useRecorderTextures = (locale: Locale): RecorderTextures | null => {
  const gl = useThree((state) => state.gl);
  const [textures, setTextures] = useState<RecorderTextures | null>(null);

  useEffect(() => {
    let cancelled = false;
    const created: Texture[] = [];
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const toTexture = (canvas: HTMLCanvasElement) => {
      const texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = anisotropy;
      created.push(texture);
      return texture;
    };

    const paint = async () => {
      const fonts = resolveFontFamilies();
      await loadFonts(fonts);
      if (cancelled) return;
      const label = { title: pick(cassette.title, locale), note: pick(cassette.note, locale), side: pick(cassette.side, locale) };
      const symbol = (key: TapeKey) => toTexture(paintKeySymbol(key, SYMBOL_COLOR[key]));
      const counter = new CounterDisplay(fonts);
      created.push(counter.texture);
      setTextures({
        face: toTexture(paintCassetteFace(label, fonts)),
        grille: toTexture(paintGrille(1024, 960)),
        brand: toTexture(paintBrandPlate(pick(cassette.brand, locale), pick(cassette.model, locale), fonts)),
        symbols: {
          record: symbol("record"),
          rewind: symbol("rewind"),
          play: symbol("play"),
          forward: symbol("forward"),
          stop: symbol("stop"),
          pause: symbol("pause"),
        },
        counter,
      });
    };
    void paint();
    return () => {
      cancelled = true;
      for (const texture of created) texture.dispose();
    };
  }, [gl, locale]);

  return textures;
};
