"use client";

import { createContext, useContext } from "react";
import { Vector3 } from "three";

export class CameraRig {
  readonly target = new Vector3();
  readonly pointer = new Vector3();
  readonly lampPosition = new Vector3();
  readonly lampDirection = new Vector3(0, 0, -1);
  private lastPointerAt = Number.NEGATIVE_INFINITY;

  trackLamp(position: Vector3, target: Vector3) {
    this.lampPosition.copy(position);
    this.lampDirection.subVectors(target, position).normalize();
  }

  trackPointer(point: Vector3, time: number) {
    this.pointer.copy(point);
    this.lastPointerAt = time;
  }

  pointerSeen(now: number, withinSeconds: number) {
    return now - this.lastPointerAt <= withinSeconds;
  }
}

export const RigContext = createContext<CameraRig | null>(null);

export const useRig = (): CameraRig => {
  const rig = useContext(RigContext);
  if (!rig) throw new Error("useRig must be used inside RigContext");
  return rig;
};
