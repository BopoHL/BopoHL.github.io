"use client";

import { useEffect, useRef, useState } from "react";
import { evidence } from "@/content/board";
import { portrait, profile } from "@/content/profile";
import type { Locale, PhotoEvidence } from "@/content/types";
import { ui } from "@/content/ui";
import { loadFonts, paintEvidence, paintRevealedMugshot, resolveFontFamilies } from "../painters";
import { paintStampCanvas } from "../painters/stamp";
import { paintCork, paintPaperBump, paintWall } from "../textures/procedural";
import { buildBlenderScene, type BlenderScene } from "./blenderScene";

declare global {
  interface Window {
    __caseScene?: BlenderScene;
  }
}

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
      canvases.push(
        { id: "surface-cork", canvas: paintCork(2048) },
        { id: "surface-wall", canvas: paintWall(512) },
        { id: "surface-paper-bump", canvas: paintPaperBump(512) },
        { id: "stamp-case-closed", canvas: paintStampCanvas(ui.caseClosed[locale], fonts) },
      );
      const finale = new URLSearchParams(window.location.search).get("finale") === "b" ? "folder" : "reveal";
      window.__caseScene = buildBlenderScene(locale, finale);
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
