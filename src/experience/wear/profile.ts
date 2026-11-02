import type { Evidence } from "@/content/types";
import { range, seededRandom, type Random } from "@/lib/random";

export type CreaseAxis = "horizontal" | "vertical";
export type Corner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

export interface Crease {
  axis: CreaseAxis;
  position: number;
  depth: number;
  spread: number;
  ridge: boolean;
}

export interface CornerCurl {
  corner: Corner;
  size: number;
  lift: number;
}

export interface Wave {
  amplitude: number;
  frequencyX: number;
  frequencyY: number;
  phaseX: number;
  phaseY: number;
}

export interface Wear {
  creases: Crease[];
  curls: CornerCurl[];
  wave: Wave;
  crumple: number;
  scuffs: number;
  fade: number;
}

interface WearRecipe {
  folds: { chance: number; max: number; depth: [number, number] };
  curls: { chance: number; lift: [number, number] };
  wave: number;
  crumple: [number, number];
  scuffs: [number, number];
  fade: number;
}

const NONE: WearRecipe = {
  folds: { chance: 0, max: 0, depth: [0, 0] },
  curls: { chance: 0, lift: [0, 0] },
  wave: 0,
  crumple: [0, 0],
  scuffs: [0, 0],
  fade: 0,
};

const NEWSPRINT: WearRecipe = {
  folds: { chance: 0.85, max: 2, depth: [0.018, 0.034] },
  curls: { chance: 0.6, lift: [0.025, 0.06] },
  wave: 0.012,
  crumple: [0.5, 1],
  scuffs: [10, 18],
  fade: 0.12,
};

const OFFICE_PAPER: WearRecipe = {
  folds: { chance: 0.45, max: 2, depth: [0.012, 0.024] },
  curls: { chance: 0.45, lift: [0.02, 0.045] },
  wave: 0.008,
  crumple: [0.25, 0.6],
  scuffs: [6, 12],
  fade: 0.08,
};

const NOTE_PAPER: WearRecipe = {
  folds: { chance: 0.15, max: 1, depth: [0.008, 0.014] },
  curls: { chance: 0.5, lift: [0.015, 0.035] },
  wave: 0.006,
  crumple: [0.15, 0.4],
  scuffs: [3, 7],
  fade: 0.04,
};

const PHOTO_PAPER: WearRecipe = {
  folds: { chance: 0.2, max: 1, depth: [0.006, 0.012] },
  curls: { chance: 0.4, lift: [0.012, 0.03] },
  wave: 0.004,
  crumple: [0.05, 0.15],
  scuffs: [4, 9],
  fade: 0,
};

const CARDBOARD: WearRecipe = {
  ...NONE,
  curls: { chance: 0.3, lift: [0.01, 0.02] },
  crumple: [0.1, 0.25],
  scuffs: [6, 10],
};

const recipeFor = (item: Evidence): WearRecipe => {
  switch (item.kind) {
    case "newspaper":
      return NEWSPRINT;
    case "typed":
    case "redacted":
    case "certificate":
    case "chart":
      return OFFICE_PAPER;
    case "sticky":
    case "scrap":
    case "tag":
      return NOTE_PAPER;
    case "photo":
      return item.frame === "mugshot" ? { ...PHOTO_PAPER, folds: NONE.folds, curls: NONE.curls, wave: 0 } : PHOTO_PAPER;
    case "folder":
      return CARDBOARD;
    case "badge":
      return NONE;
  }
};

const creasesFor = (random: Random, recipe: WearRecipe): Crease[] => {
  if (random() >= recipe.folds.chance) return [];
  const count = 1 + Math.floor(random() * recipe.folds.max);
  const first: CreaseAxis = random() < 0.65 ? "horizontal" : "vertical";
  return Array.from({ length: count }, (_, index) => ({
    axis: index === 0 ? first : first === "horizontal" ? "vertical" : "horizontal",
    position: range(random, -0.12, 0.12),
    depth: range(random, ...recipe.folds.depth),
    spread: range(random, 0.35, 0.6),
    ridge: random() < 0.6,
  }));
};

const curlsFor = (random: Random, recipe: WearRecipe): CornerCurl[] => {
  const corners: Corner[] = ["bottomLeft", "bottomRight", "topLeft", "topRight"];
  return corners
    .filter((corner) => random() < recipe.curls.chance * (corner.startsWith("bottom") ? 1 : 0.4))
    .map((corner) => ({ corner, size: range(random, 0.14, 0.32), lift: range(random, ...recipe.curls.lift) }));
};

export const wearFor = (item: Evidence): Wear => {
  const random = seededRandom(`${item.id}-wear`);
  const recipe = recipeFor(item);
  return {
    creases: creasesFor(random, recipe),
    curls: curlsFor(random, recipe),
    wave: {
      amplitude: recipe.wave * range(random, 0.6, 1.2),
      frequencyX: range(random, 0.8, 1.8),
      frequencyY: range(random, 0.6, 1.4),
      phaseX: random(),
      phaseY: random(),
    },
    crumple: range(random, ...recipe.crumple),
    scuffs: Math.round(range(random, ...recipe.scuffs)),
    fade: recipe.fade,
  };
};
