"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping } from "three";
import type { BoardContent } from "@/content/selectors";
import type { Evidence, Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import type { EvidenceTextures } from "../textures/useEvidenceTextures";
import { paintPaperBump } from "../textures/procedural";
import { BoardSurface } from "./boardSurface";
import { EvidenceCard } from "./EvidenceCard";
import { THREAD_COLORS } from "./layout3d";
import { MugshotCard } from "./MugshotCard";
import { Thread } from "./Thread";

interface CaseBoardProps {
  content: BoardContent;
  textures: EvidenceTextures;
  locale: Locale;
  onSelect: (item: Evidence) => void;
}

const isMugshot = (item: Evidence) => item.kind === "photo" && item.frame === "mugshot";

export function CaseBoard({ content, textures, locale, onSelect }: CaseBoardProps) {
  const finale = useExperience((state) => state.variant.finale);

  const bumpMap = useMemo(() => {
    const texture = new CanvasTexture(paintPaperBump(1024));
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }, []);
  useEffect(() => () => bumpMap.dispose(), [bumpMap]);
  const surface = useMemo(() => new BoardSurface(content.evidence, content.threads), [content.evidence, content.threads]);

  const threads = useMemo(
    () =>
      surface.threads.map((thread) => ({
        key: `${thread.from}->${thread.to}`,
        points: surface.threadPoints(thread),
        color: THREAD_COLORS[thread.area],
      })),
    [surface],
  );

  if (textures.front.size === 0) return null;

  return (
    <group>
      {surface.shapes.map((shape) => {
        const texture = textures.front.get(shape.item.id);
        if (!texture) return null;
        if (finale === "reveal" && isMugshot(shape.item) && textures.revealedMugshot) {
          return (
            <MugshotCard
              key={shape.item.id}
              shape={shape}
              front={texture}
              back={textures.revealedMugshot}
              bumpMap={bumpMap}
              stampText={ui.caseClosed[locale]}
              onSelect={onSelect}
            />
          );
        }
        return (
          <EvidenceCard
            key={shape.item.id}
            shape={shape}
            texture={texture}
            accentMask={textures.accent.get(shape.item.id)}
            bumpMap={bumpMap}
            onSelect={onSelect}
          />
        );
      })}
      {threads.map((thread) => (
        <Thread key={thread.key} points={thread.points} color={thread.color} />
      ))}
    </group>
  );
}
