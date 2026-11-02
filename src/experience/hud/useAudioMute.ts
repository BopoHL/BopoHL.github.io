"use client";

import { useEffect } from "react";
import { setAudioMuted } from "@/audio/rig";
import { useExperience } from "../state/store";

export const useAudioMute = () => {
  const soundOn = useExperience((state) => state.soundOn);
  useEffect(() => setAudioMuted(!soundOn), [soundOn]);
};

export const switchSoundOn = () => {
  setAudioMuted(false);
  useExperience.getState().enableSound();
};
