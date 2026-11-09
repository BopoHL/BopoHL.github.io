"use client";

import { useEffect, useState } from "react";
import { Narrator } from "@/audio/narrator";
import { narrationFor } from "@/content/narration";
import type { Locale, Station } from "@/content/types";
import { useExperience } from "../state/store";

export const useNarration = (stations: Station[], locale: Locale) => {
  const [narrator] = useState(() => new Narrator());
  const listening = useExperience((state) => state.entered && state.soundOn);
  const route = useExperience((state) => state.mode === "route");
  const station = useExperience((state) => stations[state.stationIndex]?.id);

  useEffect(() => {
    if (listening) narrator.preload(stations.map(({ id }) => narrationFor(id, locale)));
  }, [narrator, listening, stations, locale]);

  useEffect(() => {
    if (!listening || !route || !station) return;
    void narrator.say(narrationFor(station, locale));
    return () => narrator.hush();
  }, [narrator, listening, route, station, locale]);
};
