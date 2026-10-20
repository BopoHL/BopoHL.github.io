"use client";

import { useEffect, useState } from "react";
import { playTypewriter } from "@/audio/typewriter";
import type { Locale, Station } from "@/content/types";
import { useExperience } from "../state/store";
import { useReducedMotion } from "../useReducedMotion";
import styles from "./hud.module.css";

const CHAR_DELAY = 32;

export function Subtitle({ stations, locale, hidden }: { stations: Station[]; locale: Locale; hidden: boolean }) {
  const stationIndex = useExperience((state) => state.stationIndex);
  const ready = useExperience((state) => state.ready);
  const reduceMotion = useReducedMotion();
  const text = stations[stationIndex]?.subtitle[locale] ?? "";
  const [typed, setTyped] = useState({ text: "", count: 0 });
  const count = reduceMotion ? text.length : typed.text === text ? typed.count : 0;

  useEffect(() => {
    if (!ready || reduceMotion) return;
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped({ text, count: index });
      if (useExperience.getState().soundOn) {
        const char = text[index - 1];
        playTypewriter(index === text.length ? "bell" : char === " " ? "space" : "key");
      }
      if (index >= text.length) window.clearInterval(timer);
    }, CHAR_DELAY);
    return () => window.clearInterval(timer);
  }, [text, ready, reduceMotion]);

  return (
    <>
      <p className="visually-hidden" aria-live="polite">
        {text}
      </p>
      <p className={`${styles.subtitle} ${hidden ? styles.subtitleHidden : ""}`} aria-hidden="true">
        {text.slice(0, count)}
        <span className={styles.caret} />
      </p>
    </>
  );
}
