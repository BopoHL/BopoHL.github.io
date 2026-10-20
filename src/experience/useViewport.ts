"use client";

import { useSyncExternalStore } from "react";

const subscribe = (callback: () => void) => {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
};

const aspectSnapshot = () => Math.round((window.innerWidth / window.innerHeight) * 100) / 100;

export const useViewportAspect = () => useSyncExternalStore(subscribe, aspectSnapshot, () => 16 / 9);
