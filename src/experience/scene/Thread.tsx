"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CatmullRomCurve3, MathUtils, TubeGeometry, Vector3, type Mesh } from "three";

interface ThreadProps {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  visible: boolean;
  delay: number;
}

const RADIUS = 0.016;
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
    point.z += 0.025 * Math.sin(Math.PI * t);
    points.push(point);
  }
  return new CatmullRomCurve3(points);
};

export function Thread({ from, to, color, visible, delay }: ThreadProps) {
  const mesh = useRef<Mesh>(null);
  const reveal = useRef(0);
  const waited = useRef(0);
  const geometry = useMemo(() => {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const segments = Math.max(24, Math.round(start.distanceTo(end) * 10));
    return new TubeGeometry(catenary(start, end), segments, RADIUS, 6, false);
  }, [from, to]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const indexCount = geometry.index?.count ?? 0;

  useFrame((_, delta) => {
    if (!mesh.current) return;
    waited.current = visible ? waited.current + delta : 0;
    const target = visible && waited.current > delay ? 1 : 0;
    reveal.current = MathUtils.damp(reveal.current, target, visible ? 2.2 : 6, delta);
    const count = Math.floor((reveal.current * indexCount) / 3) * 3;
    geometry.setDrawRange(0, count);
    mesh.current.visible = count > 0;
  });

  return (
    <mesh ref={mesh} geometry={geometry} castShadow visible={false}>
      <meshStandardMaterial color={color} roughness={0.65} emissive={color} emissiveIntensity={0.18} />
    </mesh>
  );
}
