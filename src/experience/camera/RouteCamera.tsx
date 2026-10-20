"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { Vector3 } from "three";
import { useExperience } from "../state/store";
import { blendAt, type Shot } from "./framing";
import { useRig } from "./rig";

const HOLD = 0.32;
const PULLBACK = 0.28;
const MAX_PULLBACK = 6;
const FOLLOW = 4.5;
const PARALLAX = 0.18;
const REVEAL_THRESHOLD = 0.04;

export function RouteCamera({ shots }: { shots: Shot[] }) {
  const rig = useRig();
  const camera = useThree((state) => state.camera);
  const scratch = useRef({
    fromTarget: new Vector3(),
    toTarget: new Vector3(),
    fromPosition: new Vector3(),
    toPosition: new Vector3(),
    target: new Vector3(),
    position: new Vector3(),
  });

  useLayoutEffect(() => {
    const first = shots[0];
    if (!first) return;
    camera.position.set(...first.position);
    rig.target.set(...first.target);
    camera.lookAt(rig.target);
  }, [camera, rig, shots]);

  useFrame((state, delta) => {
    const store = useExperience.getState();
    if (store.mode !== "route" || shots.length === 0) return;
    const temp = scratch.current;

    const blend = blendAt(store.progress, shots.length, HOLD);
    const from = shots[blend.from];
    const to = shots[blend.to];
    temp.fromTarget.set(...from.target);
    temp.toTarget.set(...to.target);
    temp.fromPosition.set(...from.position);
    temp.toPosition.set(...to.position);

    temp.target.lerpVectors(temp.fromTarget, temp.toTarget, blend.amount);
    temp.position.lerpVectors(temp.fromPosition, temp.toPosition, blend.amount);
    const travel = temp.fromTarget.distanceTo(temp.toTarget);
    temp.position.z += Math.sin(Math.PI * blend.amount) * Math.min(MAX_PULLBACK, travel * PULLBACK);
    temp.position.x += state.pointer.x * PARALLAX;
    temp.position.y += state.pointer.y * PARALLAX * 0.6;

    const k = 1 - Math.exp(-delta * FOLLOW);
    state.camera.position.lerp(temp.position, k);
    rig.target.lerp(temp.target, k);
    state.camera.lookAt(rig.target);

    const nearest = shots[blend.nearest];
    if (blend.nearest !== store.shotIndex) store.setShot(blend.nearest, nearest.stationIndex);
    const revealed = store.progress >= shots.length - 1 - REVEAL_THRESHOLD;
    if (revealed !== store.revealed) store.setRevealed(revealed);
  });

  return null;
}
