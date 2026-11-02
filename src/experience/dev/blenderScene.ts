import { BOARD_SIZE } from "@/content/board";
import { sizeOf } from "@/content/geometry";
import { boardContentFor } from "@/content/selectors";
import type { FinaleVariant, Locale } from "@/content/types";
import { CAMERA_FOV, buildShots, framingFor, type Vec3 } from "../camera/framing";
import {
  BOARD_FRAME,
  BOARD_FRAME_DEPTH,
  CORK_TILE,
  KEY_ANGLE,
  KEY_DIRECTION,
  KEY_DISTANCE_RATIO,
  KEY_PENUMBRA,
  LAMP_COLOR,
  WALL_Z,
} from "../scene/constants";
import { STAMP_ASPECT } from "../painters/stamp";
import { BoardSurface } from "../scene/boardSurface";
import { PIN_COLORS, REVEAL_STAMP, THREAD_COLORS, cardZ, finishFor, pinLocal } from "../scene/layout3d";
import { THREAD_RADIUS } from "../scene/threadShader";

const RENDER_ASPECT = 16 / 9;

export const buildBlenderScene = (locale: Locale, finale: FinaleVariant) => {
  const content = boardContentFor(finale);
  const surface = new BoardSurface(content.evidence, content.threads);
  const shots = buildShots(content.stations, content.evidence, framingFor(RENDER_ASPECT));

  return {
    locale,
    finale,
    board: { ...BOARD_SIZE, frame: BOARD_FRAME, frameDepth: BOARD_FRAME_DEPTH, corkTile: CORK_TILE, wallZ: WALL_Z },
    camera: { fovDegrees: CAMERA_FOV, aspect: RENDER_ASPECT },
    lamp: { color: LAMP_COLOR, direction: KEY_DIRECTION, distanceRatio: KEY_DISTANCE_RATIO, angle: KEY_ANGLE, penumbra: KEY_PENUMBRA },
    evidence: content.evidence.map((item, index) => {
      const { width, height } = sizeOf(item);
      const finish = finishFor(item);
      return {
        id: item.id,
        kind: item.kind,
        texture: `${item.id}.png`,
        position: [item.position[0], item.position[1], cardZ(index)] as Vec3,
        rotation: item.rotation,
        width,
        height,
        roughness: finish.roughness,
        bump: finish.bumpScale,
        lift: finish.lift,
        curl: finish.curl,
        pins: surface.shapeOf(item.id).pins.map((spot) => pinLocal(item, spot)),
        pinColor: PIN_COLORS[item.area],
      };
    }),
    threadRadius: THREAD_RADIUS,
    threads: surface.threads.map((thread) => ({
      points: surface.threadPoints(thread).map((point) => point.toArray() as Vec3),
      color: THREAD_COLORS[thread.area],
    })),
    reveal:
      finale === "reveal"
        ? {
            evidenceId: "mugshot",
            back: "mugshot-revealed.png",
            stamp: { texture: "stamp-case-closed.png", aspect: STAMP_ASPECT, ...REVEAL_STAMP },
          }
        : null,
    surfaces: { cork: "surface-cork.png", wall: "surface-wall.png", paperBump: "surface-paper-bump.png" },
    stations: shots.map((shot) => ({
      id: content.stations[shot.stationIndex].id,
      label: content.stations[shot.stationIndex].label[locale],
      position: shot.position,
      target: shot.target,
    })),
  };
};

export type BlenderScene = ReturnType<typeof buildBlenderScene>;
