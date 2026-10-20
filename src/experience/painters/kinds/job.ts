import type { Locale } from "@/content/types";
import type { Surface } from "../surface";

export interface PaintJob<E> {
  item: E;
  locale: Locale;
  surface: Surface;
}
