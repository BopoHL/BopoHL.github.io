import type { Locale } from "./types";

export const narrationFor = (station: string, locale: Locale) => `/audio/narration/${locale}/${station}.mp3`;
