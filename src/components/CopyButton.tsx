"use client";

import { useEffect, useState } from "react";
import { track, type AnalyticsEvents } from "@/analytics/track";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import styles from "./copyButton.module.css";

const CONFIRM_MS = 1800;

interface CopyButtonProps {
  text: string;
  locale: Locale;
  className?: string;
  tracking?: AnalyticsEvents["contact_copied"];
}

export function CopyButton({ text, locale, className, tracking }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (tracking) track("contact_copied", tracking);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      className={`${styles.copy} ${className ?? ""}`}
      onClick={copy}
      aria-label={`${ui.copy[locale]}: ${text}`}
      aria-live="polite"
    >
      {copied ? ui.copied[locale] : ui.copy[locale]}
    </button>
  );
}
