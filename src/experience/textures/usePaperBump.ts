"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping } from "three";
import { paintPaperBump } from "./procedural";

const BUMP_SIZE = 1024;

export const usePaperBump = () => {
  const bumpMap = useMemo(() => {
    const texture = new CanvasTexture(paintPaperBump(BUMP_SIZE));
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }, []);
  useEffect(() => () => bumpMap.dispose(), [bumpMap]);
  return bumpMap;
};
