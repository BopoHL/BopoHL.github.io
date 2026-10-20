"use client";

import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import styles from "./hud.module.css";

const VISIBLE_UNTIL = 0.08;

export function ScrollHint({ locale }: { locale: Locale }) {
  const visible = useExperience((state) => state.ready && state.progress < VISIBLE_UNTIL);
  return (
    <p className={styles.scrollHint} style={{ opacity: visible ? 1 : 0 }} aria-hidden={!visible}>
      {ui.scrollHint[locale]}
    </p>
  );
}
