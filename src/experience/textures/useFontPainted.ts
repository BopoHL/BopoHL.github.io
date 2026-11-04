"use client";

import { useEffect, useState } from "react";
import { loadFonts, resolveFontFamilies, type FontFamilies } from "../painters/fonts";

export const useFontPainted = <T>(paint: (fonts: FontFamilies) => T, dispose: (value: T) => void): T | null => {
  const [painted, setPainted] = useState<T | null>(null);
  useEffect(() => {
    let cancelled = false;
    let created: T | null = null;
    const run = async () => {
      const fonts = resolveFontFamilies();
      await loadFonts(fonts);
      if (cancelled) return;
      created = paint(fonts);
      setPainted(created);
    };
    void run();
    return () => {
      cancelled = true;
      if (created !== null) dispose(created);
    };
  }, [paint, dispose]);
  return painted;
};

export const disposeTexture = (texture: { dispose: () => void }) => texture.dispose();
