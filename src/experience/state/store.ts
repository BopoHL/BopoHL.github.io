import { create } from "zustand";
import type { Locale } from "@/content/types";
import { DEFAULT_VARIANT, type PilotVariant } from "./variant";

export type CameraMode = "route" | "explore";

interface ExperienceState {
  locale: Locale;
  variant: PilotVariant;
  mode: CameraMode;
  progress: number;
  shotIndex: number;
  stationIndex: number;
  revealed: boolean;
  ready: boolean;
  paintedCount: number;
  dossierOpen: boolean;
  soundOn: boolean;
  focusedEvidence: string | null;
  setLocale: (locale: Locale) => void;
  setVariant: (variant: Partial<PilotVariant>) => void;
  setMode: (mode: CameraMode) => void;
  setProgress: (progress: number) => void;
  setShot: (shotIndex: number, stationIndex: number) => void;
  setRevealed: (revealed: boolean) => void;
  setPainted: (count: number, ready: boolean) => void;
  setDossierOpen: (open: boolean) => void;
  toggleSound: () => void;
  focusEvidence: (id: string | null) => void;
}

export const useExperience = create<ExperienceState>()((set) => ({
  locale: "en",
  variant: DEFAULT_VARIANT,
  mode: "route",
  progress: 0,
  shotIndex: 0,
  stationIndex: 0,
  revealed: false,
  ready: false,
  paintedCount: 0,
  dossierOpen: false,
  soundOn: false,
  focusedEvidence: null,
  setLocale: (locale) => set({ locale }),
  setVariant: (variant) =>
    set((state) => {
      const next = { ...state.variant, ...variant };
      return { variant: next, mode: next.explore ? state.mode : "route" };
    }),
  setMode: (mode) => set({ mode, focusedEvidence: null }),
  setProgress: (progress) => set({ progress }),
  setShot: (shotIndex, stationIndex) => set({ shotIndex, stationIndex }),
  setRevealed: (revealed) => set({ revealed }),
  setPainted: (paintedCount, ready) => set({ paintedCount, ready }),
  setDossierOpen: (dossierOpen) => set({ dossierOpen }),
  toggleSound: () => set((state) => ({ soundOn: !state.soundOn })),
  focusEvidence: (focusedEvidence) => set({ focusedEvidence }),
}));
