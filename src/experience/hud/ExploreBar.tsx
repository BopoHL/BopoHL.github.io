"use client";

import { useEffect } from "react";
import { caseFiles } from "@/content/caseFiles";
import { secrets } from "@/content/desk";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import { useMediaQuery } from "../useMediaQuery";
import styles from "./hud.module.css";

export function ExploreBar({ locale }: { locale: Locale }) {
  const mode = useExperience((state) => state.mode);
  const setMode = useExperience((state) => state.setMode);
  const focusEvidence = useExperience((state) => state.focusEvidence);
  const found = useExperience((state) => state.foundSecrets.length);
  const hovers = useMediaQuery("(hover: hover)");

  useEffect(() => {
    if (mode !== "explore") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const { focusedEvidence, statementOpen, openStatement } = useExperience.getState();
      if (statementOpen) openStatement(false);
      else if (focusedEvidence) focusEvidence(null);
      else setMode("route");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, setMode, focusEvidence]);

  if (mode !== "explore") return null;
  return (
    <div className={styles.exploreBar}>
      <p>{(hovers ? ui.exploreHint.pointer : ui.exploreHint.touch)[locale]}</p>
      <p className={styles.secrets}>
        {ui.secrets[locale]}: {found}/{secrets.length}
      </p>
      <nav className={styles.caseIndex} aria-label={ui.caseIndex[locale]}>
        {caseFiles.map((file) => (
          <button key={file.id} type="button" onClick={() => focusEvidence(file.evidence[0])}>
            {file.title[locale]}
          </button>
        ))}
      </nav>
    </div>
  );
}
