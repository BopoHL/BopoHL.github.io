"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import type { Matrix4 } from "three";
import { FramePacer } from "./framePacer";
import type { Quality } from "./quality";
import { ResolutionGovernor, pixelRatioRange } from "./resolutionGovernor";
import { useExperience } from "./state/store";

const WAKING_EVENTS = ["pointermove", "pointerdown", "wheel", "keydown", "touchstart", "touchmove"] as const;
const STILL = 1e-5;
const GAP_MS = 250;
const WARM_UP_FRAMES = 3;

const moved = (now: Matrix4, before: Matrix4) =>
  now.elements.some((value, i) => Math.abs(value - before.elements[i]) > STILL);

export function PacedFrames({ quality }: { quality: Quality }) {
  const advance = useThree((state) => state.advance);
  const setDpr = useThree((state) => state.setDpr);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const pacer = useMemo(() => new FramePacer(quality.frameRate), [quality.frameRate]);
  const governor = useMemo(
    () => new ResolutionGovernor(pixelRatioRange(quality.dpr, window.devicePixelRatio)),
    [quality.dpr],
  );

  useEffect(() => {
    pacer.request();
    pacer.wake(performance.now());
  }, [pacer, size]);

  useEffect(() => {
    const wake = () => pacer.wake(performance.now());
    for (const type of WAKING_EVENTS) window.addEventListener(type, wake, { passive: true });
    const unsubscribe = useExperience.subscribe(wake);
    const seen = camera.matrixWorld.clone();
    let lastBusyFrame: number | null = null;
    let warmUp = WARM_UP_FRAMES;
    let frame = requestAnimationFrame(function loop(now) {
      frame = requestAnimationFrame(loop);
      const { dossierOpen, entered } = useExperience.getState();
      const covered = dossierOpen || (!entered && warmUp === 0);
      const time = pacer.next(now, covered);
      if (time === null) return;
      warmUp = Math.max(0, warmUp - 1);
      const busy = pacer.awake(now);
      if (busy && lastBusyFrame !== null && now - lastBusyFrame < GAP_MS) {
        const ratio = governor.frame(now - lastBusyFrame);
        if (ratio !== null) setDpr(ratio);
      }
      lastBusyFrame = busy ? now : null;
      advance(time);
      if (!moved(camera.matrixWorld, seen)) return;
      seen.copy(camera.matrixWorld);
      pacer.wake(now);
    });
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
      for (const type of WAKING_EVENTS) window.removeEventListener(type, wake);
    };
  }, [advance, camera, governor, pacer, setDpr]);

  return null;
}
