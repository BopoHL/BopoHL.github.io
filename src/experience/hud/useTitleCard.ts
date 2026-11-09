"use client";

import { useEffect, useState } from "react";
import { activatesAudio, unlockAudio } from "@/audio/rig";
import { useExperience } from "../state/store";
import { useReducedMotion } from "../useReducedMotion";

const TITLE_MS = 3200;
const SEEN_KEY = "case404:title-seen";
const SKIP_EVENTS = ["keydown", "pointerdown", "wheel", "touchstart"] as const;
const GESTURES = ["keydown", "pointerdown", "pointerup", "touchend"] as const;

export type TitlePhase = "loading" | "title" | "done";

const seenThisSession = () => {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
};

const rememberSeen = () => {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {}
};

export const useTitleCard = (ready: boolean) => {
  const still = useReducedMotion();
  const gated = useExperience((state) => state.soundOn);
  const entered = useExperience((state) => state.entered);
  const enter = useExperience((state) => state.enter);
  const [fresh] = useState(() => !seenThisSession());
  const titled = gated || (fresh && !still);

  useEffect(() => {
    if (!ready || entered) return;
    if (!titled) {
      enter();
      return;
    }
    rememberSeen();
    if (gated) {
      const onGesture = (event: Event) => {
        if (!activatesAudio(event)) return;
        unlockAudio();
        enter();
      };
      for (const type of GESTURES) window.addEventListener(type, onGesture);
      return () => {
        for (const type of GESTURES) window.removeEventListener(type, onGesture);
      };
    }
    const timer = window.setTimeout(enter, TITLE_MS);
    for (const type of SKIP_EVENTS) window.addEventListener(type, enter, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const type of SKIP_EVENTS) window.removeEventListener(type, enter);
    };
  }, [ready, entered, titled, gated, enter]);

  const phase: TitlePhase = !ready ? "loading" : entered ? "done" : "title";
  return { phase, titled, gated };
};
