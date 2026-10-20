"use client";

import { CameraControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import CameraControlsImpl from "camera-controls";
import { useEffect, useRef } from "react";
import { Box3, Vector3 } from "three";
import { BOARD_SIZE } from "@/content/board";
import { boundsOf } from "@/content/geometry";
import type { Evidence } from "@/content/types";
import { useExperience } from "../state/store";
import { useRig } from "./rig";

const { ACTION } = CameraControlsImpl;

const boardBox = new Box3(
  new Vector3(-BOARD_SIZE.width / 2, -BOARD_SIZE.height / 2, 0),
  new Vector3(BOARD_SIZE.width / 2, BOARD_SIZE.height / 2, 0.5),
);

export function ExploreCamera({ evidence }: { evidence: Evidence[] }) {
  const controls = useRef<CameraControlsImpl>(null);
  const rig = useRig();
  const focused = useExperience((state) => state.focusedEvidence);

  useEffect(() => {
    const instance = controls.current;
    if (!instance) return;
    const position = new Vector3();
    instance.camera.getWorldPosition(position);
    instance.setLookAt(position.x, position.y, position.z, rig.target.x, rig.target.y, rig.target.z, false);
    instance.setBoundary(boardBox);
  }, [rig]);

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
      minDistance={2.5}
      maxDistance={34}
      minPolarAngle={Math.PI / 2 - 0.25}
      maxPolarAngle={Math.PI / 2 + 0.25}
      minAzimuthAngle={-0.3}
      maxAzimuthAngle={0.3}
      dollyToCursor
      smoothTime={0.35}
      mouseButtons={{ left: ACTION.TRUCK, middle: ACTION.DOLLY, right: ACTION.ROTATE, wheel: ACTION.DOLLY }}
      touches={{ one: ACTION.TOUCH_TRUCK, two: ACTION.TOUCH_DOLLY_TRUCK, three: ACTION.NONE }}
    />
  );
}
