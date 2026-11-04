"use client";

import { useEffect } from "react";
import { useExperience } from "./state/store";

const STORAGE_KEY = "case404:secrets";

const read = (): string[] => {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
};

const write = (ids: string[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    return;
  }
};

export const useSecretMemory = () => {
  useEffect(() => {
    useExperience.getState().restoreSecrets(read());
    return useExperience.subscribe((state, previous) => {
      if (state.foundSecrets !== previous.foundSecrets) write(state.foundSecrets);
    });
  }, []);
};
