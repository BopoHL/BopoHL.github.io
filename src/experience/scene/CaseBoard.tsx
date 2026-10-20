"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, RepeatWrapping } from "three";
import type { BoardContent } from "@/content/selectors";
import type { Evidence, Locale, PhotoEvidence } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import type { EvidenceTextures } from "../textures/useEvidenceTextures";
import { paintPaperBump } from "../textures/procedural";
import { occludersFor } from "./cardGeometry";
import { EvidenceCard } from "./EvidenceCard";
import { THREAD_COLORS, pinWorld } from "./layout3d";
import { MugshotCard } from "./MugshotCard";
import { Thread } from "./Thread";

interface CaseBoardProps {
  content: BoardContent;
  textures: EvidenceTextures;
  locale: Locale;
  onSelect: (item: Evidence) => void;
}

const THREAD_STAGGER = 0.28;

const isMugshot = (item: Evidence): item is PhotoEvidence => item.kind === "photo" && item.frame === "mugshot";

const required = <K, V>(map: Map<K, V>, key: K): V => {
  const value = map.get(key);
  if (value === undefined) throw new Error(`Board content references unknown key ${String(key)}`);
  return value;
};

export function CaseBoard({ content, textures, locale, onSelect }: CaseBoardProps) {
  const stationIndex = useExperience((state) => state.stationIndex);
  const mode = useExperience((state) => state.mode);
  const finale = useExperience((state) => state.variant.finale);

  const bumpMap = useMemo(() => {
    const texture = new CanvasTexture(paintPaperBump(1024));
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }, []);
  useEffect(() => () => bumpMap.dispose(), [bumpMap]);
  const occluders = useMemo(
    () => content.evidence.map((_, index) => occludersFor(content.evidence, index)),
    [content.evidence],
  );

  const threads = useMemo(() => {
    const indexById = new Map(content.evidence.map((item, index) => [item.id, index]));
    const itemById = new Map(content.evidence.map((item) => [item.id, item]));
    const stationOrder = new Map(content.stations.map((station, index) => [station.id, index]));
    const perStation = new Map<string, number>();
    return content.threads.map((thread) => {
      const order = perStation.get(thread.revealAt) ?? 0;
      perStation.set(thread.revealAt, order + 1);
      return {
        key: `${thread.from}->${thread.to}`,
        from: pinWorld(required(itemById, thread.from), required(indexById, thread.from)),
        to: pinWorld(required(itemById, thread.to), required(indexById, thread.to)),
        color: THREAD_COLORS[thread.area],
        revealIndex: required(stationOrder, thread.revealAt),
        delay: 0.35 + order * THREAD_STAGGER,
      };
    });
  }, [content]);

  if (textures.front.size === 0) return null;

  return (
    <group>
      {content.evidence.map((item, index) => {
        const texture = textures.front.get(item.id);
        if (!texture) return null;
        if (finale === "reveal" && isMugshot(item) && textures.revealedMugshot) {
          return (
            <MugshotCard
              key={item.id}
              item={item}
              index={index}
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
            key={item.id}
            item={item}
            index={index}
            texture={texture}
            bumpMap={bumpMap}
            occluders={occluders[index]}
            onSelect={onSelect}
          />
        );
      })}
      {threads.map((thread) => (
        <Thread
          key={thread.key}
          from={thread.from}
          to={thread.to}
          color={thread.color}
          visible={mode === "explore" || stationIndex >= thread.revealIndex}
          delay={mode === "explore" ? 0 : thread.delay}
        />
      ))}
    </group>
  );
}
