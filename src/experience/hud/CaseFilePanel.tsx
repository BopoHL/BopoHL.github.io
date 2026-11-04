"use client";

import { caseFileFor } from "@/content/caseFiles";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import { CaseFigure } from "./CaseFigure";
import styles from "./caseFile.module.css";

export function CaseFilePanel({ locale }: { locale: Locale }) {
  const mode = useExperience((state) => state.mode);
  const focused = useExperience((state) => state.focusedEvidence);
  const focusEvidence = useExperience((state) => state.focusEvidence);
  const file = mode === "explore" ? caseFileFor(focused) : undefined;
  if (!file) return null;

  return (
    <aside className={styles.panel} aria-labelledby="case-file-title" data-lenis-prevent>
      <header className={styles.head}>
        <p className={styles.kicker}>{ui.caseFile.kicker[locale]}</p>
        <button type="button" className={styles.close} onClick={() => focusEvidence(null)} aria-label={ui.caseFile.close[locale]}>
          ×
        </button>
      </header>
      <h2 id="case-file-title" className={styles.title}>
        {file.title[locale]}
      </h2>
      <p className={styles.period}>{file.period[locale]}</p>
      {file.figure ? <CaseFigure figure={file.figure} locale={locale} /> : null}
      <h3 className={styles.subhead}>{ui.caseFile.findings[locale]}</h3>
      <ul className={styles.findings}>
        {file.findings[locale].map((finding) => (
          <li key={finding}>{finding}</li>
        ))}
      </ul>
      <ul className={styles.stack} aria-label={ui.caseFile.stack[locale]}>
        {file.stack.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {file.link ? (
        <a className={styles.link} href={file.link.href} target="_blank" rel="noopener">
          {file.link.label[locale]} →
        </a>
      ) : null}
    </aside>
  );
}
