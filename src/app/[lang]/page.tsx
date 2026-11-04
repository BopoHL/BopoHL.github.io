import type { Locale } from "@/content/types";
import { DossierContent } from "@/dossier/DossierContent";
import { DossierOverlay } from "@/dossier/DossierOverlay";
import { CaseExperience } from "@/experience/CaseExperience";
import { jsonLd, personSchema } from "@/seo/personSchema";

export default async function CasePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const locale = lang as Locale;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personSchema(locale)) }} />
      <CaseExperience locale={locale} />
      <DossierOverlay locale={locale}>
        <DossierContent locale={locale} />
      </DossierOverlay>
    </>
  );
}
