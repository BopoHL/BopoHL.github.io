"use client";

import { useEffect } from "react";
import { track } from "@/analytics/track";
import { caseFileFor } from "@/content/caseFiles";
import { useExperience } from "./state/store";

export const useJourneyAnalytics = (stations: number) => {
  useEffect(() => {
    let deepest = -1;
    return useExperience.subscribe((state, previous) => {
      if (state.mode === "route" && state.stationIndex > deepest) {
        deepest = state.stationIndex;
        track("case_station_reached", { station: deepest, stations });
      }
      if (state.revealed && !previous.revealed) track("case_solved", {});
      if (state.mode === "explore" && previous.mode !== "explore") track("explore_started", {});
      if (state.exploreView === "desk" && previous.exploreView !== "desk") track("desk_visited", {});
      if (state.focusedEvidence !== previous.focusedEvidence) {
        const file = caseFileFor(state.focusedEvidence);
        if (file) track("case_file_opened", { file: file.id });
      }
      if (state.dossierOpen && !previous.dossierOpen) track("dossier_opened", { board: state.boardAvailable });
      if (state.soundOn !== previous.soundOn) track("sound_toggled", { on: state.soundOn });
    });
  }, [stations]);
};
