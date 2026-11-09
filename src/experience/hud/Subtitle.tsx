"use client";

import { useEffect, useState } from "react";
import { TypingBed, preloadTypingBed } from "@/audio/typingBed";
import type { Locale, Station } from "@/content/types";
import { useExperience } from "../state/store";
import { useReducedMotion } from "../useReducedMotion";
import styles from "./hud.module.css";

const CHAR_DELAY = 34;
const CHAR_JITTER = 14;
const WORD_PAUSE = 18;
const SENTENCE_PAUSE = 160;

const delayAfter = (char: string | undefined) => {
  const pause = char === " " ? WORD_PAUSE : char && ".,!?:;—".includes(char) ? SENTENCE_PAUSE : 0;
  return CHAR_DELAY + (Math.random() * 2 - 1) * CHAR_JITTER + pause;
};

export function Subtitle({ stations, locale, hidden }: { stations: Station[]; locale: Locale; hidden: boolean }) {
  const stationIndex = useExperience((state) => state.stationIndex);
  const entered = useExperience((state) => state.entered);
  const soundOn = useExperience((state) => state.soundOn);
  const reduceMotion = useReducedMotion();
  const [bed] = useState(() => new TypingBed());
  const text = stations[stationIndex]?.subtitle[locale] ?? "";
  const [typed, setTyped] = useState({ text: "", count: 0 });
  const count = reduceMotion ? text.length : typed.text === text ? typed.count : 0;
  const typing = entered && !hidden && count < text.length;

  useEffect(() => {
    if (soundOn) preloadTypingBed();
  }, [soundOn]);

  useEffect(() => {
    if (!typing || !soundOn) return;
    void bed.start();
    return () => bed.stop();
  }, [bed, typing, soundOn]);

  useEffect(() => {
    if (!entered || reduceMotion || !text) return;
    let index = 0;
    let timer = 0;
    const typeNext = () => {
      const char = text[index];
      index += 1;
      setTyped({ text, count: index });
      if (index < text.length) timer = window.setTimeout(typeNext, delayAfter(char));
    };
    timer = window.setTimeout(typeNext, CHAR_DELAY);
    return () => window.clearTimeout(timer);
  }, [text, entered, reduceMotion]);

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
