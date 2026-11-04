"use client";

import { useEffect } from "react";
import { useExperience } from "../state/store";
import styles from "./toast.module.css";

const VISIBLE_MS = 6500;

export function DeskToast() {
  const toast = useExperience((state) => state.toast);
  const showToast = useExperience((state) => state.showToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => showToast(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [toast, showToast]);

  if (!toast) return null;
  return (
    <div key={toast.serial} className={styles.toast} role="status">
      <p>{toast.text}</p>
      {toast.link ? (
        <a href={toast.link.href} target="_blank" rel="noopener">
          {toast.link.label} →
        </a>
      ) : null}
    </div>
  );
}
