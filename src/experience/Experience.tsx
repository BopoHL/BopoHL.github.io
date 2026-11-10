"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { PCFShadowMap } from "three";
import { evidence as boardEvidence } from "@/content/board";
import { deskEvidence } from "@/content/desk";
import { boardContentFor } from "@/content/selectors";
import type { Locale } from "@/content/types";
import { CAMERA_FOV, buildShots, framingFor } from "./camera/framing";
import { CINEMA_MOTION, CLASSIC_MOTION } from "./camera/motion";
import { CaseFilePanel } from "./hud/CaseFilePanel";
import { DeskToast } from "./hud/DeskToast";
import { ExploreBar } from "./hud/ExploreBar";
import { FinaleCard } from "./hud/FinaleCard";
import { Loader } from "./hud/Loader";
import { PilotPanel } from "./hud/PilotPanel";
import { ProgressThread } from "./hud/ProgressThread";
import { useNarration } from "./hud/useNarration";
import { useRainAmbience } from "./hud/useRainAmbience";
import { ScrollHint } from "./hud/ScrollHint";
import { StatementPanel } from "./hud/StatementPanel";
import { Subtitle } from "./hud/Subtitle";
import { TopBar } from "./hud/TopBar";
import styles from "./hud/hud.module.css";
import { PacedFrames } from "./PacedFrames";
import { detectQuality } from "./quality";
import { ResolutionGovernor, pixelRatioRange } from "./resolutionGovernor";
import { Scene } from "./scene/Scene";
import { useExperience } from "./state/store";
import { usePilotAccess } from "./state/usePilotAccess";
import { variantFromQuery } from "./state/variant";
import { useScrollDriver } from "./useScrollDriver";
import { useSecretMemory } from "./useSecretMemory";
import { useReducedMotion } from "./useReducedMotion";
import { useElementAspect } from "./useViewport";
import { useContextLossFallback } from "./useContextLossFallback";
import { useJourneyAnalytics } from "./useJourneyAnalytics";
import stage from "./stage.module.css";

const SCROLL_PER_SHOT_VH = { classic: 120, cinema: 110 } as const;

export function Experience({ locale }: { locale: Locale }) {
  const [quality] = useState(detectQuality);
  const [governor] = useState(() => new ResolutionGovernor(pixelRatioRange(quality.dpr, window.devicePixelRatio)));
  const [sharpest, setSharpest] = useState(quality.dpr[1]);
  const finale = useExperience((state) => state.variant.finale);
  const palette = useExperience((state) => state.variant.palette);
  const cameraStyle = useExperience((state) => state.variant.camera);
  const reduceMotion = useReducedMotion();
  const motion = cameraStyle === "cinema" && !reduceMotion ? CINEMA_MOTION : CLASSIC_MOTION;
  const mode = useExperience((state) => state.mode);
  const revealed = useExperience((state) => state.revealed);
  const ready = useExperience((state) => state.ready);
  const dossierOpen = useExperience((state) => state.dossierOpen);
  const setVariant = useExperience((state) => state.setVariant);
  const setLocale = useExperience((state) => state.setLocale);
  const stageRef = useRef<HTMLDivElement>(null);
  const pilot = usePilotAccess();
  const aspect = useElementAspect(stageRef);
  useSecretMemory();
  const watchContext = useContextLossFallback();
  useRainAmbience();

  useEffect(() => {
    setLocale(locale);
    setVariant(variantFromQuery(window.location.search));
  }, [locale, setLocale, setVariant]);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  const content = useMemo(() => boardContentFor(finale), [finale]);
  useJourneyAnalytics(content.stations.length);
  useNarration(content.stations, locale);
  const shots = useMemo(
    () => buildShots(content.stations, content.evidence, framingFor(aspect, cameraStyle), cameraStyle),
    [content, aspect, cameraStyle],
  );
  const { scrollToShot } = useScrollDriver(shots.length);
  const firstShotOfStation = (stationIndex: number) => shots.findIndex((shot) => shot.stationIndex === stationIndex);

  return (
    <>
      <div ref={stageRef} className={stage.canvas} data-mode={mode} inert={dossierOpen}>
        <Canvas
          frameloop={ready ? "never" : "demand"}
          shadows={{ type: PCFShadowMap }}
          dpr={[quality.dpr[0], sharpest]}
          camera={{ fov: CAMERA_FOV, near: 0.1, far: 200, position: [0, 0, 20] }}
          gl={{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false }}
          onCreated={({ gl }) => watchContext(gl.domElement)}
        >
          <Scene content={content} shots={shots} motion={motion} locale={locale} quality={quality} />
          {ready ? <PacedFrames rate={quality.frameRate} governor={governor} onPixelRatio={setSharpest} /> : null}
        </Canvas>
      </div>
      <div className={stage.track} style={{ height: `${(shots.length - 1) * SCROLL_PER_SHOT_VH[cameraStyle] + 100}vh` }} aria-hidden="true" />
      <div className={styles.layer} inert={dossierOpen}>
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
        <CaseFilePanel locale={locale} />
        <StatementPanel locale={locale} />
        <DeskToast />
        {pilot ? <PilotPanel locale={locale} /> : null}
      </div>
      <Loader locale={locale} total={boardEvidence.length + deskEvidence.length} />
    </>
  );
}
