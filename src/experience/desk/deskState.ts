"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { createContext, useContext } from "react";
import { Vector3 } from "three";

export class DeskState {
  readonly wind = new Vector3();
  readonly fanOrigin = new Vector3();
  fanPower = 0;

  blowFrom(origin: Vector3, direction: Vector3, power: number) {
    this.fanOrigin.copy(origin);
    this.wind.copy(direction).normalize();
    this.fanPower = power;
  }
}

export const DeskContext = createContext<DeskState | null>(null);

export const useDesk = (): DeskState => {
  const desk = useContext(DeskContext);
  if (!desk) throw new Error("useDesk must be used inside DeskContext");
  return desk;
};

export const pointerCursor = {
  onPointerOver: (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "pointer";
  },
  onPointerOut: () => {
    document.body.style.cursor = "";
  },
};
