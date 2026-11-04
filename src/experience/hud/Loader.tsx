"use client";

import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import styles from "./hud.module.css";
import { useTitleCard } from "./useTitleCard";

function TitleCard({ locale }: { locale: Locale }) {
  return (
    <div className={styles.titleCard}>
      <p className={styles.titleScene}>{ui.titleCard.scene[locale]}</p>
      <p className={styles.titleCase}>{ui.caseLabel[locale]}</p>
      <p className={styles.titleSubject}>{ui.caseOpen[locale]}</p>
      <p className={styles.titleSkip}>{ui.titleCard.skip[locale]}</p>
    </div>
  );
}

export function Loader({ locale, total }: { locale: Locale; total: number }) {
  const ready = useExperience((state) => state.ready);
  const painted = useExperience((state) => state.paintedCount);
  const { phase, titled } = useTitleCard(ready);
  const done = phase === "done";
  return (
    <div className={`${styles.loader} ${done ? styles.loaderDone : ""}`} role="status" aria-hidden={done}>
      {ready && titled ? (
        <TitleCard locale={locale} />
      ) : (
        <div className={styles.loaderInner}>
          <p className={styles.loaderTitle}>{ui.loading[locale]}</p>
          <div className={styles.loaderTrack}>
            <div className={styles.loaderBar} style={{ transform: `scaleX(${total ? painted / total : 0})` }} />
          </div>
          <p className={styles.loaderCount}>
            {painted} / {total}
          </p>
        </div>
      )}
    </div>
  );
}
