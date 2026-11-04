import type { Locale } from "@/content/types";
import { ResumePrint } from "@/dossier/ResumePrint";

export default async function ResumePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  return <ResumePrint locale={lang as Locale} />;
}
