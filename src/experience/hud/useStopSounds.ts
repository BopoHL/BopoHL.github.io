"use client";

import { useEffect, useRef } from "react";
import { playPinClick } from "@/audio/foley";
import { useExperience } from "../state/store";

export const useStopSounds = () => {
  const restingShot = useExperience((state) => state.restingShot);
  const lastStop = useRef<number | null>(null);

  useEffect(() => {
    if (restingShot === null) return;
    const previous = lastStop.current;
    lastStop.current = restingShot;
    if (previous === null || previous === restingShot) return;
    if (useExperience.getState().soundOn) playPinClick();
  }, [restingShot]);
};
