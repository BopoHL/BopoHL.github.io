"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  NormalBlending,
  PlaneGeometry,
  Vector3,
  type ShaderMaterial,
} from "three";
import { useLook } from "../scene/look";
import { useDesk } from "./deskState";
import { smokeFragmentShader, smokeVertexShader } from "./smokeShaders";

const PUFFS = 110;
const LIFE = 6.5;
const RISE = 3.4;
const DENSITY = 0.2;
const SMOKE_TONE = 0.8;
const WIND_REACH = 0.55;

const createPuffs = () => {
  const plane = new PlaneGeometry(1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.index = plane.index;
  geometry.setAttribute("position", plane.getAttribute("position"));
  geometry.setAttribute("uv", plane.getAttribute("uv"));
  const seeds = new Float32Array(PUFFS);
  for (let i = 0; i < PUFFS; i++) seeds[i] = (i + Math.random() * 0.5) / PUFFS;
  geometry.setAttribute("aSeed", new InstancedBufferAttribute(seeds, 1));
  geometry.instanceCount = PUFFS;
  return geometry;
};

export function Smoke({ origin }: { origin: Vector3 }) {
  const look = useLook();
  const desk = useDesk();
  const material = useRef<ShaderMaterial>(null);
  const geometry = useMemo(() => createPuffs(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLife: { value: LIFE },
      uRise: { value: RISE },
      uOrigin: { value: new Vector3() },
      uWind: { value: new Vector3() },
      uColor: { value: new Color() },
      uDensity: { value: DENSITY },
    }),
    [],
  );
  const scratch = useMemo(() => new Vector3(), []);

  useFrame((state) => {
    if (!material.current) return;
    const { uniforms: u } = material.current;
    u.uTime.value = state.clock.elapsedTime;
    u.uOrigin.value.copy(origin);
    u.uColor.value.copy(look.hazeColor).multiplyScalar(SMOKE_TONE);
    const toSmoke = scratch.subVectors(origin, desk.fanOrigin);
    const distance = toSmoke.length();
    const alignment = distance > 0 ? toSmoke.normalize().dot(desk.wind) : 0;
    const reach = Math.max(0, (alignment - WIND_REACH) / (1 - WIND_REACH));
    u.uWind.value.copy(desk.wind).multiplyScalar((reach * desk.fanPower) / (1 + distance * 0.12));
  });

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={2}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={smokeVertexShader}
        fragmentShader={smokeFragmentShader}
        transparent
        depthWrite={false}
        blending={NormalBlending}
      />
    </mesh>
  );
}
