"use client";

import { useEffect, useRef, useState } from "react";
import { evidence } from "@/content/board";
import { portrait, profile } from "@/content/profile";
import type { Locale, PhotoEvidence } from "@/content/types";
import { loadFonts, paintEvidence, paintRevealedMugshot, resolveFontFamilies } from "../painters";

const PIXELS_PER_UNIT = 300;

export function EvidenceSheet({ locale }: { locale: Locale }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("painting");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const fonts = resolveFontFamilies();
      await loadFonts(fonts);
      const started = performance.now();
      const canvases = await Promise.all(
        evidence.map(async (item) => ({ id: item.id, canvas: await paintEvidence(item, locale, PIXELS_PER_UNIT, fonts) })),
      );
      const mugshot = evidence.find((item): item is PhotoEvidence => item.id === "mugshot");
      if (mugshot) {
        canvases.push({
          id: "mugshot-revealed",
          canvas: await paintRevealedMugshot(mugshot, portrait, profile.name[locale], PIXELS_PER_UNIT, fonts),
        });
      }
      if (cancelled || !container.current) return;
      container.current.replaceChildren(
        ...canvases.map(({ id, canvas }) => {
          const figure = document.createElement("figure");
          figure.dataset.evidence = id;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          const caption = document.createElement("figcaption");
          caption.textContent = `${id} ${canvas.width}×${canvas.height}`;
          figure.append(canvas, caption);
          return figure;
        }),
      );
      setStatus(`ready in ${Math.round(performance.now() - started)} ms`);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return (
    <main style={{ padding: 24, background: "#5a3d26", minHeight: "100vh" }}>
      <p data-status={status}>{status}</p>
      <div ref={container} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, alignItems: "start" }} />
    </main>
  );
}
