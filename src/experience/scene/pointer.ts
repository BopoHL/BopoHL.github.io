import type { ThreeEvent } from "@react-three/fiber";

const TAP_SLOP_PX = 6;

export const isTap = (event: ThreeEvent<MouseEvent>) => event.delta <= TAP_SLOP_PX;
