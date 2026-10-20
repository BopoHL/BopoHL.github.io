import type { Locale, Localized } from "./types";

export const l = <T = string>(ru: T, en: T): Localized<T> => ({ ru, en });

export const pick = <T>(value: Localized<T>, locale: Locale): T => value[locale];
