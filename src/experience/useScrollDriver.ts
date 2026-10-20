"use client";

import Lenis from "lenis";
import { useCallback, useEffect, useRef } from "react";
import { useExperience } from "./state/store";
import { useReducedMotion } from "./useReducedMotion";

export const useScrollDriver = (shotCount: number) => {
  const lenis = useRef<Lenis | null>(null);
  const setProgress = useExperience((state) => state.setProgress);
  const paused = useExperience((state) => state.mode === "explore" || state.dossierOpen);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const instance = new Lenis({ autoRaf: true, lerp: reduceMotion ? 1 : 0.085, wheelMultiplier: 0.9 });
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress((window.scrollY / max) * Math.max(0, shotCount - 1));
    };
    instance.on("scroll", update);
    update();
    lenis.current = instance;
    return () => {
      instance.destroy();
      lenis.current = null;
    };
  }, [shotCount, setProgress, reduceMotion]);

  useEffect(() => {
    if (paused) lenis.current?.stop();
    else lenis.current?.start();
  }, [paused]);

  const scrollToShot = useCallback(
    (shot: number, immediate = false) => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      lenis.current?.scrollTo((shot / Math.max(1, shotCount - 1)) * max, { immediate, duration: 2.2 });
    },
    [shotCount],
  );

  return { scrollToShot };
};
