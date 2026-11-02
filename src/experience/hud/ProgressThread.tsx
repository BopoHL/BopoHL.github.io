"use client";

import type { Locale, Station } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import styles from "./hud.module.css";
import { useStopSounds } from "./useStopSounds";

interface ProgressThreadProps {
  stations: Station[];
  locale: Locale;
  onSelect: (stationIndex: number) => void;
}

export function ProgressThread({ stations, locale, onSelect }: ProgressThreadProps) {
  const stationIndex = useExperience((state) => state.stationIndex);
  useStopSounds();
  return (
    <ol className={styles.progress} aria-label={ui.stationsLabel[locale]}>
      {stations.map((station, index) => (
        <li key={station.id} className={styles.progressItem}>
          <button
            type="button"
            className={`${styles.pin} ${index < stationIndex ? styles.pinVisited : ""} ${index === stationIndex ? styles.pinActive : ""}`}
            aria-current={index === stationIndex ? "step" : undefined}
            aria-label={station.label[locale]}
            onClick={() => onSelect(index)}
          />
          <span className={styles.pinLabel} aria-hidden="true">
            {station.label[locale]}
          </span>
        </li>
      ))}
    </ol>
  );
}
