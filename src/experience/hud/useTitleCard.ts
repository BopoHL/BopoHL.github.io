"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "../useReducedMotion";

const TITLE_MS = 3200;
const SEEN_KEY = "case404:title-seen";
const SKIP_EVENTS = ["keydown", "pointerdown", "wheel", "touchstart"] as const;

export type TitlePhase = "loading" | "title" | "done";

const seenThisSession = () => {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
};

const rememberSeen = () => {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {}
};

export const useTitleCard = (ready: boolean) => {
  const still = useReducedMotion();
  const [fresh] = useState(() => !seenThisSession());
  const [over, setOver] = useState(false);
  const titled = fresh && !still;
  const showing = ready && titled && !over;

  useEffect(() => {
    if (!showing) return;
    rememberSeen();
    const finish = () => setOver(true);
    const timer = window.setTimeout(finish, TITLE_MS);
    for (const event of SKIP_EVENTS) window.addEventListener(event, finish, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const event of SKIP_EVENTS) window.removeEventListener(event, finish);
    };
  }, [showing]);

  const phase: TitlePhase = !ready ? "loading" : showing ? "title" : "done";
  return { phase, titled };
};
