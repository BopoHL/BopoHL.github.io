"use client";

import { useEffect } from "react";
import { playTypewriter } from "@/audio/typewriter";
import { useExperience } from "../state/store";

const STAMP_DELAY_MS = 1150;

export const useRevealSound = () => {
  const revealed = useExperience((state) => state.revealed);

  useEffect(() => {
    if (!revealed) return;
    const timer = window.setTimeout(() => {
      if (useExperience.getState().soundOn) playTypewriter("stamp");
    }, STAMP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [revealed]);
};
