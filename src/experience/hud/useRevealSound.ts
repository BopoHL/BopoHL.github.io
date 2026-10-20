"use client";

import { useEffect } from "react";
import { playStamp } from "@/audio/typewriter";
import { useExperience } from "../state/store";

const STAMP_DELAY_MS = 1150;

export const useRevealSound = () => {
  const revealed = useExperience((state) => state.revealed);

  useEffect(() => {
    if (!revealed) return;
    const timer = window.setTimeout(() => {
      const { soundOn, variant } = useExperience.getState();
      if (soundOn) playStamp(variant.typing);
    }, STAMP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [revealed]);
};
