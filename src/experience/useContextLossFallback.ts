"use client";

import { useEffect, useState } from "react";
import { useExperience } from "./state/store";

const RESTORE_GRACE_MS = 4000;

export const useContextLossFallback = () => {
  const setBoardAvailable = useExperience((state) => state.setBoardAvailable);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvas) return;
    let timer: number | undefined;
    const lost = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setBoardAvailable(false), RESTORE_GRACE_MS);
    };
    const restored = () => window.clearTimeout(timer);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      window.clearTimeout(timer);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, [canvas, setBoardAvailable]);

  return setCanvas;
};
