"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { track, type AnalyticsEvents } from "@/analytics/track";
import type { Locale } from "@/content/types";
import { useExperience } from "./state/store";
import { useWebGLSupport } from "./useWebGLSupport";

const Experience = dynamic(() => import("./Experience").then((module) => module.Experience), { ssr: false });

function BoardUnavailable({ reason }: AnalyticsEvents["board_unavailable"]) {
  const setBoardAvailable = useExperience((state) => state.setBoardAvailable);
  const setDossierOpen = useExperience((state) => state.setDossierOpen);
  useEffect(() => {
    setBoardAvailable(false);
    setDossierOpen(true);
    track("board_unavailable", { reason });
  }, [setBoardAvailable, setDossierOpen, reason]);
  return null;
}

export function CaseExperience({ locale }: { locale: Locale }) {
  const webgl = useWebGLSupport();
  const boardAvailable = useExperience((state) => state.boardAvailable);
  if (webgl === null) return null;
  if (!webgl) return <BoardUnavailable reason="no-webgl" />;
  return boardAvailable ? <Experience locale={locale} /> : <BoardUnavailable reason="context-lost" />;
}
