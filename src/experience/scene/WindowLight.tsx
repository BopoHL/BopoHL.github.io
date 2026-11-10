"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Vector3, type Object3D, type SpotLight } from "three";
import type { Quality } from "../quality";
import { useReducedMotion } from "../useReducedMotion";
import { KEY_DIRECTION } from "./constants";
import { useLook } from "./look";
import { RainyBlinds, type WindowPane } from "./rainyBlinds";
import { windowDrift } from "./windowDrift";

const WINDOW = {
  aim: new Vector3(0, -3, 0),
  distance: 60,
  angle: 0.38,
  penumbra: 0.1,
  intensity: 22000,
};
const POSITION = new Vector3(...KEY_DIRECTION).normalize().multiplyScalar(WINDOW.distance).add(WINDOW.aim);

const PANES: Record<Quality["tier"], WindowPane> = {
  high: { size: 1024, slats: 22, framesPerSecond: 12, rain: { beads: 1200, runners: 50, scale: 0.6 } },
  low: { size: 1024, slats: 22, framesPerSecond: 6, rain: { beads: 900, runners: 36, scale: 0.6 } },
};

export function WindowLight({ quality }: { quality: Quality }) {
  const look = useLook();
  const still = useReducedMotion();
  const light = useRef<SpotLight>(null);
  const target = useRef<Object3D>(null);
  const blinds = useMemo(() => new RainyBlinds(PANES[quality.tier]), [quality.tier]);

  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);

  useEffect(() => () => blinds.dispose(), [blinds]);

  useFrame((state, delta) => {
    if (!light.current || !target.current) return;
    const [across, down] = still ? [0, 0] : windowDrift(state.clock.elapsedTime);
    light.current.position.set(POSITION.x + across, POSITION.y + down, POSITION.z);
    target.current.position.set(WINDOW.aim.x + across, WINDOW.aim.y + down, WINDOW.aim.z);
    light.current.intensity = WINDOW.intensity * look.windowLight;
    light.current.color.copy(look.lampColor);
    blinds.update(state.gl, look.windowLight > 0.01 && !still ? delta : 0);
  });

  return (
    <>
      <spotLight
        ref={light}
        map={blinds.texture}
        position={POSITION}
        angle={WINDOW.angle}
        penumbra={WINDOW.penumbra}
        decay={2}
        distance={0}
        intensity={0}
      />
      <object3D ref={target} position={WINDOW.aim} />
    </>
  );
}
