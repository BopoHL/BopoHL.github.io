import type { MetadataRoute } from "next";
import { LOCALES } from "@/content/types";
import { absoluteUrl, localePath } from "@/seo/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LOCALES.map((locale) => [locale, absoluteUrl(localePath(locale))]));
  return LOCALES.map((locale) => ({
    url: absoluteUrl(localePath(locale)),
    changeFrequency: "monthly",
    priority: 1,
    alternates: { languages },
  }));
}
