import { Euler, MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import type { Area } from "@/content/types";
import type { CardShape } from "./cardGeometry";
import { cardZ, pinLocal, pinTilt } from "./layout3d";

const Z_AXIS = new Vector3(0, 0, 1);
const UNIT = new Vector3(1, 1, 1);

const cardMatrix = ({ item, index }: CardShape) =>
  new Matrix4().compose(
    new Vector3(item.position[0], item.position[1], cardZ(index)),
    new Quaternion().setFromAxisAngle(Z_AXIS, MathUtils.degToRad(item.rotation)),
    UNIT,
  );

export const pinPlacements = (shapes: CardShape[]): Map<Area, Matrix4[]> => {
  const placements = new Map<Area, Matrix4[]>();
  for (const shape of shapes) {
    const card = cardMatrix(shape);
    const matrices = placements.get(shape.item.area) ?? [];
    for (const spot of shape.pins) {
      const tilt = new Quaternion().setFromEuler(new Euler(...pinTilt(shape.item, spot)));
      const pin = new Matrix4().compose(new Vector3(...pinLocal(shape.item, spot)), tilt, UNIT);
      matrices.push(card.clone().multiply(pin));
    }
    placements.set(shape.item.area, matrices);
  }
  return placements;
};
