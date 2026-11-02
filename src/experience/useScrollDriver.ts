"use client";

import Lenis from "lenis";
import { useCallback, useEffect, useRef } from "react";
import { leashed } from "./scrollLeash";
import { useExperience } from "./state/store";
import { useReducedMotion } from "./useReducedMotion";

const SCROLL_LEAD = 1.25;
const TRAVEL_DURATION = 2.2;

const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

export const useScrollDriver = (shotCount: number) => {
  const lenis = useRef<Lenis | null>(null);
  const setProgress = useExperience((state) => state.setProgress);
  const travelTo = useExperience((state) => state.travelTo);
  const paused = useExperience((state) => state.mode === "explore" || state.dossierOpen);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const instance = new Lenis({ autoRaf: true, lerp: reduceMotion ? 1 : 0.085, wheelMultiplier: 0.9, syncTouch: true });
    const lastShot = Math.max(0, shotCount - 1);
    const update = () => {
      const max = maxScroll();
      const progress = (window.scrollY / max) * lastShot;
      const { viewedProgress, travelTarget } = useExperience.getState();
      const allowed = travelTarget === null ? leashed(progress, viewedProgress, SCROLL_LEAD) : progress;
      if (allowed !== progress) instance.scrollTo((allowed / Math.max(1, lastShot)) * max, { immediate: true, force: true });
      setProgress(allowed);
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
      travelTo(shot);
      lenis.current?.scrollTo((shot / Math.max(1, shotCount - 1)) * maxScroll(), { immediate, duration: TRAVEL_DURATION });
    },
    [shotCount, travelTo],
  );

  return { scrollToShot };
};
