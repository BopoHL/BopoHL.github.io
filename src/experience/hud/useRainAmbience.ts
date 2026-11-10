"use client";

import { useEffect, useState } from "react";
import { RainAmbience } from "@/audio/rain";
import { useExperience } from "../state/store";

export const useRainAmbience = () => {
  const soundOn = useExperience((state) => state.soundOn);
  const entered = useExperience((state) => state.entered);
  const [rain] = useState(() => new RainAmbience());

  useEffect(() => {
    if (!soundOn || !entered) return;
    rain.start();
    return () => rain.stop();
  }, [rain, soundOn, entered]);
};
