import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { pick } from "@/content/localize";
import { LOCALES, type Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { fontVariables } from "@/fonts";
import "lenis/dist/lenis.css";
import "../globals.css";

export const dynamicParams = false;

export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: pick(ui.meta.title, lang),
    description: pick(ui.meta.description, lang),
    alternates: { languages: Object.fromEntries(LOCALES.map((locale) => [locale, `/${locale}/`])) },
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
      <body>{children}</body>
    </html>
  );
}
