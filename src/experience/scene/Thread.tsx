"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CatmullRomCurve3, MathUtils, TubeGeometry, Vector3, type Mesh, type PerspectiveCamera } from "three";
import { useAccentShader } from "./look";
import { THREAD_RADIUS, ThreadShader } from "./threadShader";

interface ThreadProps {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  visible: boolean;
  delay: number;
}

const SAG_PER_UNIT = 0.035;
const CONTROL_POINTS = 14;

const catenary = (from: Vector3, to: Vector3) => {
  const length = from.distanceTo(to);
  const sag = Math.min(0.6, length * SAG_PER_UNIT);
  const points: Vector3[] = [];
  for (let i = 0; i <= CONTROL_POINTS; i++) {
    const t = i / CONTROL_POINTS;
    const point = from.clone().lerp(to, t);
    point.y -= sag * 4 * t * (1 - t);
    point.z += 0.012 * Math.sin(Math.PI * t);
    points.push(point);
  }
  return new CatmullRomCurve3(points);
};

export function Thread({ from, to, color, visible, delay }: ThreadProps) {
  const mesh = useRef<Mesh>(null);
  const accentShader = useAccentShader();
  const viewportHeight = useThree((state) => state.size.height);
  const reveal = useRef(0);
  const waited = useRef(0);
  const { geometry, length } = useMemo(() => {
    const curve = catenary(new Vector3(...from), new Vector3(...to));
    const curveLength = curve.getLength();
    const segments = Math.max(32, Math.round(curveLength * 14));
    return {
      geometry: new TubeGeometry(curve, segments, THREAD_RADIUS, 8, false),
      length: curveLength,
    };
  }, [from, to]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const shader = useMemo(() => new ThreadShader(accentShader, length), [accentShader, length]);
  const indexCount = geometry.index?.count ?? 0;

  useFrame((state, delta) => {
    if (!mesh.current) return;
    shader.updateView((state.camera as PerspectiveCamera).fov, viewportHeight);
    waited.current = visible ? waited.current + delta : 0;
    const target = visible && waited.current > delay ? 1 : 0;
    reveal.current = MathUtils.damp(reveal.current, target, visible ? 2.2 : 6, delta);
    const count = Math.floor((reveal.current * indexCount) / 3) * 3;
    geometry.setDrawRange(0, count);
    mesh.current.visible = count > 0;
  });

  return (
    <mesh ref={mesh} geometry={geometry} castShadow visible={false}>
      <meshStandardMaterial
        onBeforeCompile={shader.onBeforeCompile}
        customProgramCacheKey={shader.customProgramCacheKey}
        color={color}
        roughness={0.85}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}
