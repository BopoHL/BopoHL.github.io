"use client";

import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import styles from "./hud.module.css";

export function Loader({ locale, total }: { locale: Locale; total: number }) {
  const ready = useExperience((state) => state.ready);
  const painted = useExperience((state) => state.paintedCount);
  return (
    <div className={`${styles.loader} ${ready ? styles.loaderDone : ""}`} role="status" aria-hidden={ready}>
      <div className={styles.loaderInner}>
        <p className={styles.loaderTitle}>{ui.loading[locale]}</p>
        <div className={styles.loaderTrack}>
          <div className={styles.loaderBar} style={{ transform: `scaleX(${total ? painted / total : 0})` }} />
        </div>
        <p className={styles.loaderCount}>
          {painted} / {total}
        </p>
      </div>
    </div>
  );
}
