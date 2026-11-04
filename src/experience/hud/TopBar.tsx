"use client";

import { track, trackOnClick } from "@/analytics/track";
import { LOCALES, type Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { unlockAudio } from "@/audio/rig";
import { useExperience } from "../state/store";
import { useAudioMute } from "./useAudioMute";
import { usePilotAccess } from "../state/usePilotAccess";
import { variantToQuery } from "../state/variant";
import styles from "./hud.module.css";

export function TopBar({ locale }: { locale: Locale }) {
  useAudioMute();
  const revealed = useExperience((state) => state.revealed);
  const soundOn = useExperience((state) => state.soundOn);
  const toggleSound = useExperience((state) => state.toggleSound);
  const setDossierOpen = useExperience((state) => state.setDossierOpen);
  const variant = useExperience((state) => state.variant);
  const pilot = usePilotAccess();

  const skip = () => {
    track("investigation_skipped", { station: useExperience.getState().stationIndex });
    setDossierOpen(true);
  };

  const handleSound = () => {
    if (!soundOn) unlockAudio();
    toggleSound();
  };

  return (
    <header className={styles.topBar}>
      <div>
        <p className={styles.caseTitle}>{ui.caseLabel[locale]}</p>
        <p className={`${styles.caseStatus} ${revealed ? styles.caseStatusClosed : ""}`}>
          {revealed ? ui.caseClosed[locale] : ui.caseOpen[locale]}
        </p>
      </div>
      <nav className={styles.controls} aria-label={ui.language[locale]}>
        <div className={styles.languages}>
          {LOCALES.map((code) => (
            <a
              key={code}
              className={styles.textButton}
              href={pilot ? `/${code}/${variantToQuery(variant, true)}` : `/${code}/`}
              hrefLang={code}
              aria-current={code === locale}
              {...trackOnClick("locale_switched", { to: code })}
            >
              {code.toUpperCase()}
            </a>
          ))}
        </div>
        <button type="button" className={styles.textButton} aria-pressed={soundOn} onClick={handleSound}>
          {soundOn ? ui.soundOn[locale] : ui.soundOff[locale]}
        </button>
        <button type="button" className={styles.skip} onClick={skip}>
          {ui.skip[locale]}
        </button>
      </nav>
    </header>
  );
}
