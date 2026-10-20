import type { FinaleVariant } from "@/content/types";

export type Palette = "warm" | "noir" | "mono";
export type CameraStyle = "classic" | "cinema";

export interface PilotVariant {
  finale: FinaleVariant;
  explore: boolean;
  palette: Palette;
  camera: CameraStyle;
}

export const DEFAULT_VARIANT: PilotVariant = {
  finale: "reveal",
  explore: true,
  palette: "warm",
  camera: "classic",
};

const FINALE_QUERY: Record<FinaleVariant, string> = { reveal: "a", folder: "b" };
const PALETTES: readonly Palette[] = ["warm", "noir", "mono"];
const CAMERA_STYLES: readonly CameraStyle[] = ["classic", "cinema"];

const oneOf = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

export const variantToQuery = ({ finale, explore, palette, camera }: PilotVariant) => {
  const params = new URLSearchParams({
    finale: FINALE_QUERY[finale],
    route: explore ? "free" : "linear",
    look: palette,
    camera,
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
  };
};
