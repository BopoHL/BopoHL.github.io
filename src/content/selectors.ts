import { evidence, threads } from "./board";
import { stationsFor } from "./route";
import type { Evidence, FinaleVariant, Station, Thread } from "./types";

const inVariant = (item: { variant?: FinaleVariant }, variant: FinaleVariant) =>
  item.variant === undefined || item.variant === variant;

export interface BoardContent {
  evidence: Evidence[];
  threads: Thread[];
  stations: Station[];
}

export const boardContentFor = (variant: FinaleVariant): BoardContent => ({
  evidence: evidence.filter((item) => inVariant(item, variant)),
  threads: threads.filter((item) => inVariant(item, variant)),
  stations: stationsFor(variant),
});

export const validateBoardContent = ({ evidence, threads, stations }: BoardContent): string[] => {
  const ids = new Set(evidence.map((item) => item.id));
  const errors: string[] = [];

  if (ids.size !== evidence.length) errors.push("Duplicate evidence ids");

  for (const thread of threads) {
    if (!ids.has(thread.from)) errors.push(`Thread from unknown evidence: ${thread.from}`);
    if (!ids.has(thread.to)) errors.push(`Thread to unknown evidence: ${thread.to}`);
  }

  for (const station of stations) {
    if (station.focus === "all") continue;
    for (const id of station.focus) {
      if (!ids.has(id)) errors.push(`Station ${station.id} focuses unknown evidence: ${id}`);
    }
  }

  return errors;
};
