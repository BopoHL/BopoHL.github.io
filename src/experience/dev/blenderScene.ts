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
import { PIN_COLORS, REVEAL_STAMP, THREAD_COLORS, cardZ, finishFor, pinLocal, pinWorld } from "../scene/layout3d";

const RENDER_ASPECT = 16 / 9;

export const buildBlenderScene = (locale: Locale, finale: FinaleVariant) => {
  const content = boardContentFor(finale);
  const stationIndexById = new Map(content.stations.map((station, index) => [station.id, index]));
  const indexById = new Map(content.evidence.map((item, index) => [item.id, index]));
  const itemById = new Map(content.evidence.map((item) => [item.id, item]));
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
        pin: pinLocal(item),
        pinColor: PIN_COLORS[item.area],
      };
    }),
    threads: content.threads.map((thread) => {
      const from = itemById.get(thread.from);
      const to = itemById.get(thread.to);
      if (!from || !to) throw new Error(`Unknown thread ${thread.from} -> ${thread.to}`);
      return {
        from: pinWorld(from, indexById.get(thread.from) ?? 0),
        to: pinWorld(to, indexById.get(thread.to) ?? 0),
        color: THREAD_COLORS[thread.area],
        station: stationIndexById.get(thread.revealAt) ?? 0,
      };
    }),
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
