import { create } from "zustand";
import type { Locale } from "@/content/types";
import type { StatementDraft } from "@/contact/statement";
import { DEFAULT_VARIANT, type PilotVariant } from "./variant";

export type CameraMode = "route" | "explore";
export type ExploreView = "board" | "desk" | "typewriter";

export interface Keystroke {
  char: string;
  serial: number;
}

interface ExperienceState {
  locale: Locale;
  variant: PilotVariant;
  mode: CameraMode;
  progress: number;
  viewedProgress: number | null;
  travelTarget: number | null;
  restingShot: number | null;
  shotIndex: number;
  stationIndex: number;
  revealed: boolean;
  ready: boolean;
  paintedCount: number;
  dossierOpen: boolean;
  boardAvailable: boolean;
  soundOn: boolean;
  focusedEvidence: string | null;
  exploreView: ExploreView;
  statementOpen: boolean;
  statement: StatementDraft;
  statementFiled: boolean;
  keystroke: Keystroke;
  setLocale: (locale: Locale) => void;
  setVariant: (variant: Partial<PilotVariant>) => void;
  setMode: (mode: CameraMode) => void;
  setProgress: (progress: number) => void;
  setViewedProgress: (progress: number | null) => void;
  travelTo: (progress: number | null) => void;
  setRestingShot: (shot: number | null) => void;
  setShot: (shotIndex: number, stationIndex: number) => void;
  setRevealed: (revealed: boolean) => void;
  setPainted: (count: number, ready: boolean) => void;
  setDossierOpen: (open: boolean) => void;
  setBoardAvailable: (available: boolean) => void;
  toggleSound: () => void;
  enableSound: () => void;
  focusEvidence: (id: string | null) => void;
  setExploreView: (view: ExploreView) => void;
  openStatement: (open: boolean) => void;
  editStatement: (draft: Partial<StatementDraft>) => void;
  fileStatement: () => void;
  strikeKey: (char: string) => void;
}

export const useExperience = create<ExperienceState>()((set) => ({
  locale: "en",
  variant: DEFAULT_VARIANT,
  mode: "route",
  progress: 0,
  viewedProgress: null,
  travelTarget: null,
  restingShot: null,
  shotIndex: 0,
  stationIndex: 0,
  revealed: false,
  ready: false,
  paintedCount: 0,
  dossierOpen: false,
  boardAvailable: true,
  soundOn: false,
  focusedEvidence: null,
  exploreView: "board",
  statementOpen: false,
  statement: { name: "", contact: "", message: "" },
  statementFiled: false,
  keystroke: { char: "", serial: 0 },
  setLocale: (locale) => set({ locale }),
  setVariant: (variant) =>
    set((state) => {
      const next = { ...state.variant, ...variant };
      return { variant: next, mode: next.explore ? state.mode : "route" };
    }),
  setMode: (mode) => set({ mode, focusedEvidence: null, exploreView: "board", statementOpen: false }),
  setProgress: (progress) => set({ progress }),
  setViewedProgress: (viewedProgress) => set({ viewedProgress }),
  travelTo: (travelTarget) => set({ travelTarget }),
  setRestingShot: (restingShot) => set({ restingShot }),
  setShot: (shotIndex, stationIndex) => set({ shotIndex, stationIndex }),
  setRevealed: (revealed) => set({ revealed }),
  setPainted: (paintedCount, ready) => set({ paintedCount, ready }),
  setDossierOpen: (dossierOpen) => set((state) => ({ dossierOpen: dossierOpen || !state.boardAvailable })),
  setBoardAvailable: (boardAvailable) => set({ boardAvailable }),
  toggleSound: () => set((state) => ({ soundOn: !state.soundOn })),
  enableSound: () => set({ soundOn: true }),
  focusEvidence: (focusedEvidence) => set({ focusedEvidence }),
  setExploreView: (exploreView) => set({ exploreView, focusedEvidence: null, statementOpen: exploreView === "typewriter" }),
  openStatement: (open) =>
    set((state) =>
      open
        ? { statementOpen: true, mode: "explore", exploreView: "typewriter", focusedEvidence: null }
        : { statementOpen: false, exploreView: state.exploreView === "typewriter" ? "desk" : state.exploreView },
    ),
  editStatement: (draft) => set((state) => ({ statement: { ...state.statement, ...draft }, statementFiled: false })),
  fileStatement: () => set({ statementFiled: true }),
  strikeKey: (char) => set((state) => ({ keystroke: { char, serial: state.keystroke.serial + 1 } })),
}));
