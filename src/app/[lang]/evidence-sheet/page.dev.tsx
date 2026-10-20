import type { Locale } from "@/content/types";
import { EvidenceSheet } from "@/experience/dev/EvidenceSheet";

export default async function EvidenceSheetPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <EvidenceSheet locale={lang as Locale} />;
}
