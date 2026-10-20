import type { Locale } from "@/content/types";
import { DossierContent } from "@/dossier/DossierContent";
import { DossierOverlay } from "@/dossier/DossierOverlay";
import { CaseExperience } from "@/experience/CaseExperience";

export default async function CasePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  const locale = lang as Locale;
  return (
    <>
      <CaseExperience locale={locale} />
      <DossierOverlay locale={locale}>
        <DossierContent locale={locale} />
      </DossierOverlay>
    </>
  );
}
