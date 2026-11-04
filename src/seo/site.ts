import { LOCALES, type Locale } from "@/content/types";

export const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export const localePath = (locale: Locale) => `/${locale}/`;

export const OPEN_GRAPH_LOCALE: Record<Locale, string> = { ru: "ru_RU", en: "en_US" };

export const ogImagePath = (locale: Locale) => `/og/case-404-${locale}.jpg`;

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export const languageAlternates = () => Object.fromEntries(LOCALES.map((locale) => [locale, localePath(locale)]));
