"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { boundsOf } from "@/content/geometry";
import type { Evidence } from "@/content/types";
import { useExperience, type ExploreView } from "../state/store";
import { useReducedMotion } from "../useReducedMotion";
import { LOOK, LookAround, TYPEWRITER_POSE, boardPose, cardPose, createPose, deskPose, type Place } from "./lookAround";
import { useRig } from "./rig";
import { VectorSpring } from "./spring";

const SMOOTH_TIME = 0.45;
const WHEEL_ZOOM_PER_PIXEL = 0.0015;
const WHEEL_LINE_PIXELS = 16;
const PINCH_GAIN = 8;
const CASE_PANEL = { widthPx: 428, fromViewportPx: 900 };

const KEYS: Record<string, { u?: number; v?: number; zoom?: number }> = {
  ArrowLeft: { u: -LOOK.keyStep },
  ArrowRight: { u: LOOK.keyStep },
  ArrowUp: { v: -LOOK.keyStep },
  ArrowDown: { v: LOOK.keyStep },
  "+": { zoom: -LOOK.keyZoom },
  "=": { zoom: -LOOK.keyZoom },
  "-": { zoom: LOOK.keyZoom },
};

const placeOf = (view: ExploreView): Place => (view === "desk" ? "desk" : "board");

const following = () => {
  const { focusedEvidence, exploreView } = useExperience.getState();
  return !focusedEvidence && exploreView !== "typewriter";
};

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const coveredByCasePanel = (viewportWidth: number) =>
  viewportWidth >= CASE_PANEL.fromViewportPx ? CASE_PANEL.widthPx / viewportWidth : 0;

export function ExploreCamera({ evidence }: { evidence: Evidence[] }) {
  const rig = useRig();
  const camera = useThree((state) => state.camera);
  const canvas = useThree((state) => state.gl.domElement);
  const still = useReducedMotion();
  const look = useMemo(() => new LookAround(), []);
  const bounds = useMemo(() => new Map(evidence.map((item) => [item.id, boundsOf(item)])), [evidence]);
  const springs = useMemo(() => ({ position: new VectorSpring(), target: new VectorSpring() }), []);
  const pose = useMemo(() => createPose(), []);
  const arrived = useRef<Place>("board");

  useLayoutEffect(() => {
    springs.position.reset(camera.position);
    springs.target.reset(rig.target);
  }, [camera, rig, springs]);

  useEffect(() => {
    const touches = new Map<number, { x: number; y: number }>();
    const place = () => placeOf(useExperience.getState().exploreView);
    const spread = () => {
      const [a, b] = [...touches.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    };
    const onUp = (event: PointerEvent) => touches.delete(event.pointerId);
    const onLeave = (event: PointerEvent) => {
      if (event.pointerType !== "touch") look.leave();
    };
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (event.pointerType !== "touch") {
        look.point((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
        return;
      }
      const last = touches.get(event.pointerId);
      if (!last) return;
      const before = touches.size === 2 ? spread() : 0;
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (!following()) return;
      if (touches.size === 1) look.nudge((last.x - event.clientX) / rect.width, (last.y - event.clientY) / rect.height);
      else if (touches.size === 2 && before > 0) look.zoom(Math.log(before / Math.max(1, spread())), place());
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (!following()) return;
      const pixels = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * WHEEL_LINE_PIXELS : event.deltaY;
      look.zoom(pixels * WHEEL_ZOOM_PER_PIXEL * (event.ctrlKey ? PINCH_GAIN : 1), place());
    };
    const onKey = (event: KeyboardEvent) => {
      const step = KEYS[event.key];
      if (!step || !following() || isEditable(event.target)) return;
      event.preventDefault();
      if (step.zoom) look.zoom(step.zoom, place());
      else look.nudge(step.u ?? 0, step.v ?? 0);
    };

    const pointer: Array<[string, (event: PointerEvent) => void]> = [
      ["pointerdown", onDown],
      ["pointermove", onMove],
      ["pointerup", onUp],
      ["pointercancel", onUp],
      ["pointerleave", onLeave],
    ];
    for (const [type, listener] of pointer) canvas.addEventListener(type, listener as EventListener);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      for (const [type, listener] of pointer) canvas.removeEventListener(type, listener as EventListener);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [canvas, look]);

  useFrame((state, delta) => {
    const store = useExperience.getState();
    const place = placeOf(store.exploreView);
    if (place !== arrived.current) {
      look.arrive(place);
      arrived.current = place;
    }
    if (following()) {
      const request = look.update(place, delta);
      if (request === "leave") store.setMode("route");
      else if (request) store.setExploreView(request);
    }

    const aspect = state.size.width / state.size.height;
    const turn = still ? 0 : 1;
    const card = store.focusedEvidence ? bounds.get(store.focusedEvidence) : undefined;
    if (card) cardPose(card, aspect, coveredByCasePanel(state.size.width), pose);
    else if (store.exploreView === "typewriter") {
      pose.position.copy(TYPEWRITER_POSE.position);
      pose.target.copy(TYPEWRITER_POSE.target);
    } else if (place === "desk") deskPose(look.aim, look.deskScale * look.pullback(), aspect, turn, pose);
    else boardPose(look.aim, look.boardDistance * look.pullback(), aspect, turn, pose);

    state.camera.position.copy(springs.position.update(pose.position, SMOOTH_TIME, delta));
    rig.target.copy(springs.target.update(pose.target, SMOOTH_TIME, delta));
    state.camera.lookAt(rig.target);
  });

  return null;
}
