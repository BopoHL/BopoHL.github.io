"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  MathUtils,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  type Group,
  type HemisphereLight,
  type Object3D,
  type ShaderMaterial,
  type SpotLight,
} from "three";
import { useRig } from "../camera/rig";
import type { Quality } from "../quality";
import { useReducedMotion } from "../useReducedMotion";
import { lampBrightness, lampSway } from "./lampLife";
import { NeonSpill } from "./NeonSpill";
import { RainyBlinds } from "./rainyBlinds";
import { useLook } from "./look";
import { KEY_ANGLE, KEY_DIRECTION as KEY_DIRECTION_TUPLE, KEY_DISTANCE_RATIO, KEY_PENUMBRA, LAMP_COLOR } from "./constants";
import { beamFragmentShader, beamVertexShader, dustFragmentShader, dustVertexShader } from "./shaders";

const KEY_DIRECTION = new Vector3(...KEY_DIRECTION_TUPLE).normalize();
const KEY_INTENSITY = 1100;
const KEY_FOLLOW = 2.2;
const REFERENCE_DISTANCE = 12;
const FLASHLIGHT_INTENSITY = 420;
const FLASHLIGHT_OFFSET = new Vector3(0.8, -0.6, 0);
const FLASHLIGHT_IDLE_SECONDS = 4;
const BOARD_PLANE = new Plane(new Vector3(0, 0, 1), -0.05);
const DOWN = new Vector3(0, -1, 0);
const WHITE = new Color("#ffffff");
const FLASHLIGHT_WHITENESS = 0.6;
const BEAM_STRENGTH = 0.085;
const SWAY_X = new Vector3(1, 0, 0);
const SWAY_Y = new Vector3(0, 1, 0);

const createDustGeometry = (count: number) => {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const along = Math.random();
    const radius = Math.sqrt(Math.random()) * 0.5 * along;
    const angle = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.5 - along;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    seeds[i] = Math.random();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  return geometry;
};

function KeyLight({ quality }: { quality: Quality }) {
  const rig = useRig();
  const look = useLook();
  const still = useReducedMotion();
  const light = useRef<SpotLight>(null);
  const target = useRef<Object3D>(null);
  const beam = useRef<Group>(null);
  const beamShader = useRef<ShaderMaterial>(null);
  const dustShader = useRef<ShaderMaterial>(null);
  const motion = useRef({
    position: new Vector3(),
    lit: new Vector3(),
    aim: new Vector3(),
    desired: new Vector3(),
    direction: new Vector3(),
    reach: REFERENCE_DISTANCE,
  });
  const cone = useMemo(() => new ConeGeometry(0.5, 1, 48, 1, true), []);
  const dust = useMemo(() => createDustGeometry(quality.dustCount), [quality.dustCount]);
  const beamUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uColor: { value: new Color() }, uStrength: { value: BEAM_STRENGTH } }),
    [],
  );
  const dustUniforms = useMemo(() => ({ uTime: { value: 0 }, uSize: { value: 9 }, uColor: { value: new Color() } }), []);
  const blinds = useMemo(() => new RainyBlinds(), []);

  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);

  useEffect(() => () => cone.dispose(), [cone]);
  useEffect(() => () => dust.dispose(), [dust]);
  useEffect(() => () => blinds.dispose(), [blinds]);

  useFrame((state, delta) => {
    const m = motion.current;
    const k = 1 - Math.exp(-delta * KEY_FOLLOW);
    m.reach = MathUtils.lerp(m.reach, state.camera.position.distanceTo(rig.target), k);
    m.aim.lerp(rig.target, k);
    m.desired.copy(m.aim).addScaledVector(KEY_DIRECTION, m.reach * KEY_DISTANCE_RATIO);
    m.position.lerp(m.desired, k);
    const time = state.clock.elapsedTime;
    const [swayX, swayY] = still ? [0, 0] : lampSway(time);
    const brightness = still ? 1 : lampBrightness(time);
    m.lit.copy(m.position).addScaledVector(SWAY_X, swayX * m.reach).addScaledVector(SWAY_Y, swayY * m.reach);
    target.current?.position.copy(m.aim);
    rig.trackLamp(m.lit, m.aim);
    if (light.current) {
      light.current.position.copy(m.lit);
      light.current.intensity = KEY_INTENSITY * (m.reach / REFERENCE_DISTANCE) ** 2 * brightness;
      light.current.color.copy(look.lampColor);
      light.current.penumbra = look.penumbra;
      if (look.blinds && !still) blinds.update(delta);
      const map = look.blinds ? blinds.texture : null;
      if (light.current.map !== map) light.current.map = map;
    }
    if (beam.current) {
      const length = m.lit.distanceTo(m.aim);
      const radius = Math.tan(KEY_ANGLE) * length * 0.9;
      beam.current.position.copy(m.lit).lerp(m.aim, 0.5);
      beam.current.scale.set(radius * 2, length, radius * 2);
      beam.current.quaternion.setFromUnitVectors(DOWN, m.direction.subVectors(m.aim, m.lit).normalize());
    }
    if (beamShader.current) {
      beamShader.current.uniforms.uTime.value = time;
      beamShader.current.uniforms.uStrength.value = BEAM_STRENGTH * brightness;
      beamShader.current.uniforms.uColor.value.copy(look.hazeColor);
    }
    if (dustShader.current) {
      dustShader.current.uniforms.uTime.value = state.clock.elapsedTime;
      dustShader.current.uniforms.uColor.value.copy(look.hazeColor);
    }
  });

  return (
    <>
      <spotLight
        ref={light}
        color={LAMP_COLOR}
        intensity={KEY_INTENSITY}
        distance={0}
        decay={2}
        angle={KEY_ANGLE}
        penumbra={KEY_PENUMBRA}
        castShadow
        shadow-mapSize={[quality.shadowMapSize, quality.shadowMapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-near={2}
        shadow-camera-far={120}
      />
      <object3D ref={target} />
      <group ref={beam}>
        <mesh geometry={cone}>
          <shaderMaterial
            ref={beamShader}
            uniforms={beamUniforms}
            vertexShader={beamVertexShader}
            fragmentShader={beamFragmentShader}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
        <points geometry={dust}>
          <shaderMaterial
            ref={dustShader}
            uniforms={dustUniforms}
            vertexShader={dustVertexShader}
            fragmentShader={dustFragmentShader}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </points>
      </group>
    </>
  );
}

function Flashlight() {
  const rig = useRig();
  const look = useLook();
  const light = useRef<SpotLight>(null);
  const target = useRef<Object3D>(null);
  const tracking = useRef({ raycaster: new Raycaster(), hit: new Vector3(), ndc: new Vector2(), strength: 0 });

  useEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);

  useFrame((state, delta) => {
    const t = tracking.current;
    if (state.pointer.x !== t.ndc.x || state.pointer.y !== t.ndc.y) {
      t.ndc.copy(state.pointer);
      t.raycaster.setFromCamera(t.ndc, state.camera);
      if (t.raycaster.ray.intersectPlane(BOARD_PLANE, t.hit)) rig.trackPointer(t.hit, state.clock.elapsedTime);
    }
    const active = rig.pointerSeen(state.clock.elapsedTime, FLASHLIGHT_IDLE_SECONDS);
    t.strength = MathUtils.damp(t.strength, active ? 1 : 0.35, 3, delta);
    if (!light.current || !target.current) return;
    target.current.position.lerp(active ? rig.pointer : rig.target, 1 - Math.exp(-delta * 7));
    light.current.position.copy(state.camera.position).add(FLASHLIGHT_OFFSET);
    const reach = state.camera.position.distanceTo(target.current.position) / REFERENCE_DISTANCE;
    light.current.intensity = FLASHLIGHT_INTENSITY * reach * reach * t.strength;
    light.current.color.copy(look.lampColor).lerp(WHITE, FLASHLIGHT_WHITENESS);
  });

  return (
    <>
      <spotLight ref={light} color="#ffe6c4" intensity={0} distance={0} decay={2} angle={0.2} penumbra={0.75} />
      <object3D ref={target} />
    </>
  );
}

function Ambient() {
  const look = useLook();
  const light = useRef<HemisphereLight>(null);

  useFrame(() => {
    if (!light.current) return;
    light.current.color.copy(look.skyColor);
    light.current.groundColor.copy(look.groundColor);
    light.current.intensity = look.ambient;
  });

  return <hemisphereLight ref={light} />;
}

export function Lighting({ quality }: { quality: Quality }) {
  return (
    <>
      <Ambient />
      <KeyLight quality={quality} />
      <Flashlight />
      <NeonSpill />
    </>
  );
}
