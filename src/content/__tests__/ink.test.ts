import { describe, expect, it } from "vitest";
import { evidence } from "../board";
import { LOCALES, type Evidence, type Locale } from "../types";

const isLocalized = (value: unknown): value is Record<Locale, unknown> =>
  typeof value === "object" && value !== null && LOCALES.every((locale) => locale in value);

const collect = (value: unknown, locale: Locale): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((entry) => collect(entry, locale));
  if (isLocalized(value)) return collect(value[locale], locale);
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap((entry) => collect(entry, locale));
  return [];
};

const printedText = (item: Evidence, locale: Locale) =>
  Object.entries(item)
    .filter(([key]) => key !== "ink" && key !== "id" && key !== "link")
    .flatMap(([, value]) => collect(value, locale))
    .join(" ");

describe.each(LOCALES)("ink annotations in %s", (locale) => {
  const annotated = evidence.filter((item) => item.ink);

  it("annotate some evidence", () => {
    expect(annotated.length).toBeGreaterThan(5);
  });

  it.each(annotated.map((item) => [item.id, item] as const))("marks only words printed on %s", (_, item) => {
    const text = printedText(item, locale);
    for (const mark of item.ink?.[locale].marks ?? []) expect(text).toContain(mark.phrase);
  });

  it.each(annotated.map((item) => [item.id, item] as const))("keeps notes of %s on the paper", (_, item) => {
    for (const note of item.ink?.[locale].notes ?? []) {
      expect(note.at[0]).toBeGreaterThanOrEqual(0);
      expect(note.at[0]).toBeLessThan(1);
      expect(note.at[1]).toBeGreaterThan(0);
      expect(note.at[1]).toBeLessThan(1);
    }
  });
});
