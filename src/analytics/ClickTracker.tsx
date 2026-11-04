"use client";

import { useEffect } from "react";
import { ANALYTICS_KEY, trackFromElement } from "./track";

export function ClickTracker() {
  useEffect(() => {
    if (!ANALYTICS_KEY) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("[data-track]") : null;
      if (target instanceof HTMLElement) trackFromElement(target);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
