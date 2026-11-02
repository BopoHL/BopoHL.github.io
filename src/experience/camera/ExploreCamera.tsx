"use client";

import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import CameraControlsImpl from "camera-controls";
import { useEffect, useRef } from "react";
import { Box3, Vector3 } from "three";
import { BOARD_SIZE } from "@/content/board";
import { boundsOf } from "@/content/geometry";
import type { Evidence } from "@/content/types";
import { DESK } from "../desk/layout";
import { useExperience, type ExploreView } from "../state/store";
import { useRig } from "./rig";

const { ACTION } = CameraControlsImpl;
const MIN_DISTANCE = 5.5;

const roomBox = new Box3(
  new Vector3(-BOARD_SIZE.width / 2, DESK.top, 0),
  new Vector3(BOARD_SIZE.width / 2, BOARD_SIZE.height / 2, DESK.front),
);

const VIEWS: Record<ExploreView, { position: Vector3; target: Vector3 }> = {
  board: { position: new Vector3(0, 0, 26), target: new Vector3(0, 0, 0) },
  desk: {
    position: new Vector3(-0.5, DESK.top + 11.5, (DESK.back + DESK.front) / 2 + 12.5),
    target: new Vector3(-0.5, DESK.top, (DESK.back + DESK.front) / 2),
  },
};

export function ExploreCamera({ evidence }: { evidence: Evidence[] }) {
  const controls = useRef<CameraControlsImpl>(null);
  const rig = useRig();
  const focused = useExperience((state) => state.focusedEvidence);
  const view = useExperience((state) => state.exploreView);
  const previousView = useRef<ExploreView>(view);

  useEffect(() => {
    const instance = controls.current;
    if (!instance) return;
    const position = new Vector3();
    instance.camera.getWorldPosition(position);
    instance.setLookAt(position.x, position.y, position.z, rig.target.x, rig.target.y, rig.target.z, false);
    instance.setBoundary(roomBox);
  }, [rig]);

  useEffect(() => {
    const instance = controls.current;
    if (!instance || view === previousView.current) return;
    previousView.current = view;
    const { position, target } = VIEWS[view];
    instance.setLookAt(position.x, position.y, position.z, target.x, target.y, target.z, true);
  }, [view]);

  useEffect(() => {
    const instance = controls.current;
    if (!instance || !focused) return;
    const item = evidence.find((candidate) => candidate.id === focused);
    if (!item) return;
    const bounds = boundsOf(item);
    const box = new Box3(new Vector3(bounds.minX, bounds.minY, 0), new Vector3(bounds.maxX, bounds.maxY, 0.2));
    instance.fitToBox(box, true, { paddingTop: 0.4, paddingBottom: 0.9, paddingLeft: 0.4, paddingRight: 0.4 });
  }, [focused, evidence]);

  useFrame(() => {
    controls.current?.getTarget(rig.target);
  });

  return (
    <CameraControls
      ref={controls}
      minDistance={MIN_DISTANCE}
      maxDistance={34}
      minPolarAngle={Math.PI / 2 - 1.05}
      maxPolarAngle={Math.PI / 2 + 0.25}
      minAzimuthAngle={-0.45}
      maxAzimuthAngle={0.45}
      dollyToCursor
      smoothTime={0.35}
      mouseButtons={{ left: ACTION.TRUCK, middle: ACTION.DOLLY, right: ACTION.ROTATE, wheel: ACTION.DOLLY }}
      touches={{ one: ACTION.TOUCH_TRUCK, two: ACTION.TOUCH_DOLLY_TRUCK, three: ACTION.NONE }}
    />
  );
}
