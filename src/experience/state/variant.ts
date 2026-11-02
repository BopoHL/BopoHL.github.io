import { TYPEWRITER_PROFILE_IDS, type TypewriterProfileId } from "@/audio/profiles";
import type { FinaleVariant } from "@/content/types";

export type Palette = "warm" | "noir" | "mono";
export type CameraStyle = "classic" | "cinema";
export type TypingSound = TypewriterProfileId;
export type PinStyle = "push" | "map";

export interface PilotVariant {
  finale: FinaleVariant;
  explore: boolean;
  palette: Palette;
  camera: CameraStyle;
  typing: TypingSound;
  pins: PinStyle;
}

export const DEFAULT_VARIANT: PilotVariant = {
  finale: "reveal",
  explore: true,
  palette: "noir",
  camera: "cinema",
  typing: "heavy",
  pins: "push",
};

const FINALE_QUERY: Record<FinaleVariant, string> = { reveal: "a", folder: "b" };
const PALETTES: readonly Palette[] = ["warm", "noir", "mono"];
const CAMERA_STYLES: readonly CameraStyle[] = ["classic", "cinema"];
const PIN_STYLES: readonly PinStyle[] = ["push", "map"];

const oneOf = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

export const variantToQuery = ({ finale, explore, palette, camera, typing, pins }: PilotVariant) => {
  const params = new URLSearchParams({
    finale: FINALE_QUERY[finale],
    route: explore ? "free" : "linear",
    look: palette,
    camera,
    typing,
    pins,
  });
  return `?${params.toString()}`;
};

export const variantFromQuery = (search: string): PilotVariant => {
  const params = new URLSearchParams(search);
  return {
    finale: params.get("finale") === FINALE_QUERY.folder ? "folder" : "reveal",
    explore: params.get("route") !== "linear",
    palette: oneOf(params.get("look"), PALETTES, DEFAULT_VARIANT.palette),
    camera: oneOf(params.get("camera"), CAMERA_STYLES, DEFAULT_VARIANT.camera),
    typing: oneOf(params.get("typing"), TYPEWRITER_PROFILE_IDS, DEFAULT_VARIANT.typing),
    pins: oneOf(params.get("pins"), PIN_STYLES, DEFAULT_VARIANT.pins),
  };
};
