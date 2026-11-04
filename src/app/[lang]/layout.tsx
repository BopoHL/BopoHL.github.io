import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ClickTracker } from "@/analytics/ClickTracker";
import { pick } from "@/content/localize";
import { LOCALES, type Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { fontVariables } from "@/fonts";
import { languageAlternates, localePath, OG_IMAGE_SIZE, OPEN_GRAPH_LOCALE, ogImagePath, SITE_URL } from "@/seo/site";
import "lenis/dist/lenis.css";
import "../globals.css";

export const dynamicParams = false;

export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const title = pick(ui.meta.title, lang);
  const description = pick(ui.meta.description, lang);
  const image = { url: ogImagePath(lang), ...OG_IMAGE_SIZE, alt: title };
  return {
    metadataBase: SITE_URL,
    title,
    description,
    alternates: { canonical: localePath(lang), languages: languageAlternates() },
    openGraph: {
      type: "profile",
      siteName: pick(ui.caseLabel, lang),
      title,
      description,
      url: localePath(lang),
      locale: OPEN_GRAPH_LOCALE[lang],
      alternateLocale: LOCALES.filter((locale) => locale !== lang).map((locale) => OPEN_GRAPH_LOCALE[locale]),
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0806",
  colorScheme: "dark",
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} className={fontVariables}>
      <body>
        {children}
        <ClickTracker />
      </body>
    </html>
  );
}
