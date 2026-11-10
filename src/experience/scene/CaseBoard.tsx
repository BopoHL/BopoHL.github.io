"use client";

import { useMemo } from "react";
import type { Texture } from "three";
import type { BoardContent } from "@/content/selectors";
import type { Evidence, Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import type { EvidenceTextures } from "../textures/useEvidenceTextures";
import { BoardSurface } from "./boardSurface";
import { EvidenceCard } from "./EvidenceCard";
import { MugshotCard } from "./MugshotCard";
import { Pins } from "./Pins";
import { Threads } from "./Threads";

interface CaseBoardProps {
  content: BoardContent;
  textures: EvidenceTextures;
  bumpMap: Texture;
  locale: Locale;
  onSelect: (item: Evidence) => void;
}

const isMugshot = (item: Evidence) => item.kind === "photo" && item.frame === "mugshot";

export function CaseBoard({ content, textures, bumpMap, locale, onSelect }: CaseBoardProps) {
  const finale = useExperience((state) => state.variant.finale);
  const pinStyle = useExperience((state) => state.variant.pins);

  const surface = useMemo(
    () => new BoardSurface(content.evidence, content.threads, pinStyle),
    [content.evidence, content.threads, pinStyle],
  );

  const pinned = useMemo(
    () => surface.shapes.filter((shape) => textures.front.has(shape.item.id)),
    [surface, textures.front],
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
            canLift={surface.canLift(shape)}
            bumpMap={bumpMap}
            onSelect={onSelect}
          />
        );
      })}
      <Pins shapes={pinned} />
      <Threads runs={surface.runs} />
    </group>
  );
}
