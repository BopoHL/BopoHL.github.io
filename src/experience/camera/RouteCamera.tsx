"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useExperience } from "../state/store";
import type { Shot } from "./framing";
import type { CameraMotion } from "./motion";
import { useRig } from "./rig";
import { RouteFollower } from "./routeFollower";
import { RouteTrack } from "./routeTrack";

const REVEAL_THRESHOLD = 0.04;
const OPENING_DOLLY = 9;
const STAMP_IMPACT_AT = 1.12;
const SHAKE_DURATION = 0.45;
const SHAKE_AMPLITUDE = 0.08;
const SETTLED_HASTE = 0.35;
const ARRIVED = 0.02;
const ABANDONED = 0.5;
const VIEW_EPSILON = 1e-4;

interface RouteCameraProps {
  shots: Shot[];
  motion: CameraMotion;
}

export function RouteCamera({ shots, motion }: RouteCameraProps) {
  const rig = useRig();
  const camera = useThree((state) => state.camera);
  const follower = useMemo(() => new RouteFollower(new RouteTrack(shots, motion), motion), [shots, motion]);
  const status = useRef({ following: false, revealedAt: Number.NEGATIVE_INFINITY });

  useLayoutEffect(() => {
    const first = shots[0];
    if (!first) return;
    camera.position.set(first.position[0], first.position[1], first.position[2] + OPENING_DOLLY);
    rig.target.set(...first.target);
    camera.lookAt(rig.target);
    status.current.following = false;
  }, [camera, rig, shots]);

  useFrame((state, delta) => {
    const store = useExperience.getState();
    const current = status.current;
    if (store.mode !== "route" || shots.length === 0) {
      if (current.following) store.setViewedProgress(null);
      current.following = false;
      return;
    }
    if (!current.following) {
      follower.reset(store.progress, state.camera.position, rig.target);
      current.following = true;
    }

    const destination = store.travelTarget;
    follower.update(store.progress, delta, state.pointer, destination !== null);
    if (
      destination !== null &&
      (Math.abs(follower.progress - destination) < ARRIVED || Math.abs(store.progress - destination) > ABANDONED)
    ) {
      store.travelTo(null);
    }
    const viewed = store.viewedProgress;
    if (viewed === null || Math.abs(viewed - follower.progress) > VIEW_EPSILON) store.setViewedProgress(follower.progress);
    state.camera.position.copy(follower.position);
    rig.target.copy(follower.target);

    const sinceImpact = state.clock.elapsedTime - current.revealedAt - STAMP_IMPACT_AT;
    if (store.variant.finale === "reveal" && sinceImpact > 0 && sinceImpact < SHAKE_DURATION) {
      const fade = 1 - sinceImpact / SHAKE_DURATION;
      state.camera.position.x += Math.sin(sinceImpact * 90) * SHAKE_AMPLITUDE * fade;
      state.camera.position.y += Math.cos(sinceImpact * 70) * SHAKE_AMPLITUDE * fade;
    }
    state.camera.lookAt(rig.target);
    state.camera.rotateZ(follower.roll);

    if (follower.haste < SETTLED_HASTE && follower.nearest !== store.shotIndex) {
      store.setShot(follower.nearest, shots[follower.nearest].stationIndex);
    }
    const revealed = follower.progress >= shots.length - 1 - REVEAL_THRESHOLD;
    if (revealed !== store.revealed) {
      current.revealedAt = revealed ? state.clock.elapsedTime : Number.NEGATIVE_INFINITY;
      store.setRevealed(revealed);
    }
  });

  return null;
}
