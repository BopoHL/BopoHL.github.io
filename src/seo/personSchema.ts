import { dossierLanguages, dossierSkills } from "@/content/dossier";
import { pick } from "@/content/localize";
import { contacts, portrait, profile } from "@/content/profile";
import type { Locale } from "@/content/types";
import { absoluteUrl, localePath, ogImagePath } from "./site";

export const personSchema = (locale: Locale) => {
  const email = contacts.find((contact) => contact.id === "email");
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: pick(profile.name, locale),
    jobTitle: pick(profile.role, locale),
    url: absoluteUrl(localePath(locale)),
    image: absoluteUrl(portrait.src ?? ogImagePath(locale)),
    email: email?.value,
    address: { "@type": "PostalAddress", addressLocality: locale === "ru" ? "Ташкент" : "Tashkent", addressCountry: "UZ" },
    sameAs: contacts.filter((contact) => contact.href.startsWith("https://")).map((contact) => contact.href),
    knowsAbout: pick(dossierSkills, locale).flatMap((line) => line.split(/,\s*|\s—\s/)).filter(Boolean),
    knowsLanguage: dossierLanguages.en.map((line) => line.split(" — ")[0]),
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "IT Park University",
      address: { "@type": "PostalAddress", addressLocality: "Tashkent", addressCountry: "UZ" },
    },
  };
};

export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
