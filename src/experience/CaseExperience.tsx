"use client";

import dynamic from "next/dynamic";
import type { Locale } from "@/content/types";

const Experience = dynamic(() => import("./Experience").then((module) => module.Experience), { ssr: false });

export function CaseExperience({ locale }: { locale: Locale }) {
  return <Experience locale={locale} />;
}
