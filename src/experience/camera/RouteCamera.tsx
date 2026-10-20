"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { MathUtils, Vector3 } from "three";
import { useExperience } from "../state/store";
import { blendAt, type Shot } from "./framing";
import { moveTiming, type CameraMotion } from "./motion";
import { useRig } from "./rig";
import { ScalarSpring, VectorSpring } from "./spring";

const REVEAL_THRESHOLD = 0.04;
const OPENING_DOLLY = 9;
const STAMP_IMPACT_AT = 1.12;
const SHAKE_DURATION = 0.45;
const SHAKE_AMPLITUDE = 0.08;
const BOARD_NORMAL = new Vector3(0, 0, 1);

interface RouteCameraProps {
  shots: Shot[];
  motion: CameraMotion;
}

export function RouteCamera({ shots, motion }: RouteCameraProps) {
  const rig = useRig();
  const camera = useThree((state) => state.camera);
  const scratch = useRef({
    fromTarget: new Vector3(),
    toTarget: new Vector3(),
    fromPosition: new Vector3(),
    toPosition: new Vector3(),
    control: new Vector3(),
    side: new Vector3(),
    target: new Vector3(),
    position: new Vector3(),
    positionSpring: new VectorSpring(),
    targetSpring: new VectorSpring(),
    rollSpring: new ScalarSpring(),
    following: false,
    revealedAt: Number.NEGATIVE_INFINITY,
  });

  useLayoutEffect(() => {
    const first = shots[0];
    if (!first) return;
    camera.position.set(first.position[0], first.position[1], first.position[2] + OPENING_DOLLY);
    rig.target.set(...first.target);
    camera.lookAt(rig.target);
    scratch.current.following = false;
  }, [camera, rig, shots]);

  useFrame((state, delta) => {
    const store = useExperience.getState();
    const temp = scratch.current;
    if (store.mode !== "route" || shots.length === 0) {
      temp.following = false;
      return;
    }
    if (!temp.following) {
      temp.positionSpring.reset(state.camera.position);
      temp.targetSpring.reset(rig.target);
      temp.rollSpring.reset(0);
      temp.following = true;
    }

    const blend = blendAt(store.progress, shots.length, motion.hold);
    const from = shots[blend.from];
    const to = shots[blend.to];
    const { gaze, travel } = moveTiming(blend.raw, motion);
    temp.fromTarget.set(...from.target);
    temp.toTarget.set(...to.target);
    temp.fromPosition.set(...from.position);
    temp.toPosition.set(...to.position);

    const distance = temp.fromTarget.distanceTo(temp.toTarget);
    const pullback = distance > 0.01 ? MathUtils.clamp(distance * motion.pullback, motion.minPullback, motion.maxPullback) : 0;
    const swingSide = blend.from % 2 === 0 ? 1 : -1;
    temp.side.subVectors(temp.toTarget, temp.fromTarget).cross(BOARD_NORMAL).normalize();
    temp.control
      .addVectors(temp.fromPosition, temp.toPosition)
      .multiplyScalar(0.5)
      .addScaledVector(BOARD_NORMAL, pullback * 2)
      .addScaledVector(temp.side, swingSide * distance * motion.swing);

    const inverse = 1 - travel;
    temp.position
      .copy(temp.fromPosition)
      .multiplyScalar(inverse * inverse)
      .addScaledVector(temp.control, 2 * inverse * travel)
      .addScaledVector(temp.toPosition, travel * travel);
    temp.target.lerpVectors(temp.fromTarget, temp.toTarget, gaze);
    const bank = Math.sin(Math.PI * travel) * motion.bank * swingSide;
    const roll = MathUtils.lerp(from.roll, to.roll, travel) + bank;

    temp.position.x += state.pointer.x * motion.parallax;
    temp.position.y += state.pointer.y * motion.parallax * 0.6;

    const step = Math.min(delta, 0.1);
    state.camera.position.copy(temp.positionSpring.update(temp.position, motion.settle, step));
    rig.target.copy(temp.targetSpring.update(temp.target, motion.settle, step));
    const smoothedRoll = temp.rollSpring.update(roll, motion.settle, step);

    const sinceImpact = state.clock.elapsedTime - temp.revealedAt - STAMP_IMPACT_AT;
    if (store.variant.finale === "reveal" && sinceImpact > 0 && sinceImpact < SHAKE_DURATION) {
      const fade = 1 - sinceImpact / SHAKE_DURATION;
      state.camera.position.x += Math.sin(sinceImpact * 90) * SHAKE_AMPLITUDE * fade;
      state.camera.position.y += Math.cos(sinceImpact * 70) * SHAKE_AMPLITUDE * fade;
    }
    state.camera.lookAt(rig.target);
    state.camera.rotateZ(smoothedRoll);

    const nearest = shots[blend.nearest];
    if (blend.nearest !== store.shotIndex) store.setShot(blend.nearest, nearest.stationIndex);
    const revealed = store.progress >= shots.length - 1 - REVEAL_THRESHOLD;
    if (revealed !== store.revealed) {
      temp.revealedAt = revealed ? state.clock.elapsedTime : Number.NEGATIVE_INFINITY;
      store.setRevealed(revealed);
    }
  });

  return null;
}
