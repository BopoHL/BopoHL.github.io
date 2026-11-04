"use client";

import { useSyncExternalStore } from "react";

let supported: boolean | undefined;

const detect = () => {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
};

const snapshot = () => (supported ??= detect());
const neverChanges = () => () => {};

export const useWebGLSupport = (): boolean | null => useSyncExternalStore(neverChanges, snapshot, () => null);
