"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import type { Locale } from "@/content/types";
import { useExperience } from "./state/store";
import { useWebGLSupport } from "./useWebGLSupport";

const Experience = dynamic(() => import("./Experience").then((module) => module.Experience), { ssr: false });

function BoardUnavailable() {
  const setBoardAvailable = useExperience((state) => state.setBoardAvailable);
  const setDossierOpen = useExperience((state) => state.setDossierOpen);
  useEffect(() => {
    setBoardAvailable(false);
    setDossierOpen(true);
  }, [setBoardAvailable, setDossierOpen]);
  return null;
}

export function CaseExperience({ locale }: { locale: Locale }) {
  const webgl = useWebGLSupport();
  if (webgl === null) return null;
  return webgl ? <Experience locale={locale} /> : <BoardUnavailable />;
}
