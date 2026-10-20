"use client";

import { useEffect } from "react";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import styles from "./hud.module.css";

export function ExploreBar({ locale }: { locale: Locale }) {
  const mode = useExperience((state) => state.mode);
  const setMode = useExperience((state) => state.setMode);

  useEffect(() => {
    if (mode !== "explore") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMode("route");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, setMode]);

  if (mode !== "explore") return null;
  return (
    <div className={styles.exploreBar}>
      <p>{ui.exploreHint[locale]}</p>
      <button type="button" className={styles.secondary} onClick={() => setMode("route")}>
        {ui.backToRoute[locale]}
      </button>
    </div>
  );
}
