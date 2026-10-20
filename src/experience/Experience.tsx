"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { PCFShadowMap } from "three";
import { evidence as allEvidence } from "@/content/board";
import { boardContentFor } from "@/content/selectors";
import type { Locale } from "@/content/types";
import { CAMERA_FOV, buildShots, framingFor } from "./camera/framing";
import { ExploreBar } from "./hud/ExploreBar";
import { FinaleCard } from "./hud/FinaleCard";
import { Loader } from "./hud/Loader";
import { PilotPanel } from "./hud/PilotPanel";
import { ProgressThread } from "./hud/ProgressThread";
import { ScrollHint } from "./hud/ScrollHint";
import { Subtitle } from "./hud/Subtitle";
import { TopBar } from "./hud/TopBar";
import styles from "./hud/hud.module.css";
import { detectQuality } from "./quality";
import { Scene } from "./scene/Scene";
import { useExperience } from "./state/store";
import { variantFromQuery } from "./state/variant";
import { useScrollDriver } from "./useScrollDriver";
import { useElementAspect } from "./useViewport";
import stage from "./stage.module.css";

const SCROLL_PER_SHOT_VH = 120;

export function Experience({ locale }: { locale: Locale }) {
  const [quality] = useState(detectQuality);
  const finale = useExperience((state) => state.variant.finale);
  const mode = useExperience((state) => state.mode);
  const revealed = useExperience((state) => state.revealed);
  const ready = useExperience((state) => state.ready);
  const setVariant = useExperience((state) => state.setVariant);
  const setLocale = useExperience((state) => state.setLocale);
  const stageRef = useRef<HTMLDivElement>(null);
  const aspect = useElementAspect(stageRef);

  useEffect(() => {
    setLocale(locale);
    setVariant(variantFromQuery(window.location.search));
  }, [locale, setLocale, setVariant]);

  const content = useMemo(() => boardContentFor(finale), [finale]);
  const shots = useMemo(() => buildShots(content.stations, content.evidence, framingFor(aspect)), [content, aspect]);
  const { scrollToShot } = useScrollDriver(shots.length);
  const firstShotOfStation = (stationIndex: number) => shots.findIndex((shot) => shot.stationIndex === stationIndex);

  return (
    <>
      <div ref={stageRef} className={stage.canvas}>
        <Canvas
          frameloop={ready ? "always" : "demand"}
          shadows={{ type: PCFShadowMap }}
          dpr={quality.dpr}
          camera={{ fov: CAMERA_FOV, near: 0.1, far: 200, position: [0, 0, 20] }}
          gl={{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false }}
        >
          <Scene content={content} shots={shots} locale={locale} quality={quality} />
        </Canvas>
      </div>
      <div className={stage.track} style={{ height: `${(shots.length - 1) * SCROLL_PER_SHOT_VH + 100}vh` }} aria-hidden="true" />
      <div className={styles.layer}>
        <TopBar locale={locale} />
        {mode === "route" ? (
          <>
            <Subtitle stations={content.stations} locale={locale} hidden={revealed} />
            <ScrollHint locale={locale} />
            <ProgressThread
              stations={content.stations}
              locale={locale}
              onSelect={(stationIndex) => scrollToShot(firstShotOfStation(stationIndex))}
            />
          </>
        ) : null}
        <FinaleCard locale={locale} />
        <ExploreBar locale={locale} />
        <PilotPanel locale={locale} />
      </div>
      <Loader locale={locale} total={allEvidence.length} />
    </>
  );
}
