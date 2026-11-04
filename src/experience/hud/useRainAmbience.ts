"use client";

import { useEffect, useState } from "react";
import { RainAmbience } from "@/audio/rain";
import { useExperience } from "../state/store";

export const useRainAmbience = () => {
  const soundOn = useExperience((state) => state.soundOn);
  const ready = useExperience((state) => state.ready);
  const [rain] = useState(() => new RainAmbience());

  useEffect(() => {
    if (!soundOn || !ready) return;
    rain.start();
    return () => rain.stop();
  }, [rain, soundOn, ready]);
};
