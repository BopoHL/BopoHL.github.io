"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import type { Matrix4 } from "three";
import { FramePacer, type FrameRate } from "./framePacer";
import { useExperience } from "./state/store";

const WAKING_EVENTS = ["pointermove", "pointerdown", "wheel", "keydown", "touchstart", "touchmove"] as const;
const STILL = 1e-5;

const moved = (now: Matrix4, before: Matrix4) =>
  now.elements.some((value, i) => Math.abs(value - before.elements[i]) > STILL);

export function PacedFrames({ rate }: { rate: FrameRate }) {
  const advance = useThree((state) => state.advance);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const pacer = useMemo(() => new FramePacer(rate), [rate]);

  useEffect(() => {
    pacer.request();
    pacer.wake(performance.now());
  }, [pacer, size]);

  useEffect(() => {
    const wake = () => pacer.wake(performance.now());
    for (const type of WAKING_EVENTS) window.addEventListener(type, wake, { passive: true });
    const unsubscribe = useExperience.subscribe(wake);
    const seen = camera.matrixWorld.clone();
    let frame = requestAnimationFrame(function loop(now) {
      frame = requestAnimationFrame(loop);
      const time = pacer.next(now, useExperience.getState().dossierOpen);
      if (time === null) return;
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
  }, [advance, camera, pacer]);

  return null;
}
