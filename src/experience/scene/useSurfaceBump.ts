"use client";

import { useEffect, useMemo } from "react";
import type { Texture } from "three";
import { seededRandom } from "@/lib/random";

export const useSurfaceBump = (bumpMap: Texture, seed: string) => {
  const texture = useMemo(() => {
    const random = seededRandom(`${seed}-bump`);
    const variant = bumpMap.clone();
    variant.center.set(0.5, 0.5);
    variant.rotation = random() * Math.PI * 2;
    variant.offset.set(random(), random());
    return variant;
  }, [bumpMap, seed]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
};
