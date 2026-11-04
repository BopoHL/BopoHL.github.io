"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import styles from "./copyButton.module.css";

const CONFIRM_MS = 1800;

interface CopyButtonProps {
  text: string;
  locale: Locale;
  className?: string;
}

export function CopyButton({ text, locale, className }: CopyButtonProps) {
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
