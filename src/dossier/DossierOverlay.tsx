"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "@/experience/state/store";
import styles from "./dossier.module.css";

export function DossierOverlay({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const open = useExperience((state) => state.dossierOpen);
  const setOpen = useExperience((state) => state.setDossierOpen);
  const closeButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement;
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (returnFocus.current instanceof HTMLElement) returnFocus.current.focus();
    };
  }, [open, setOpen]);

  return (
    <div
      className={`${styles.overlay} ${open ? styles.overlayOpen : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-title"
      aria-hidden={!open}
      inert={!open}
      data-lenis-prevent
    >
      <div className={styles.bar}>
        <span className={styles.barTitle}>{ui.dossier.title[locale]}</span>
        <button ref={closeButton} type="button" className={styles.close} onClick={() => setOpen(false)}>
          {ui.dossier.close[locale]}
        </button>
      </div>
      {children}
    </div>
  );
}
