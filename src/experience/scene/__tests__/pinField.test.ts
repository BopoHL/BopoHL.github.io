import { Group, MathUtils, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { boardContentFor } from "@/content/selectors";
import type { Area } from "@/content/types";
import { BoardSurface } from "../boardSurface";
import type { CardShape } from "../cardGeometry";
import { cardZ, pinAxis, pinLocal, pinTilt } from "../layout3d";
import { pinPlacements } from "../pinField";

const { evidence, threads } = boardContentFor("reveal");
const { shapes } = new BoardSurface(evidence, threads);

const asChildOfCard = (shape: CardShape, spot: CardShape["pins"][number]) => {
  const card = new Group();
  card.position.set(shape.item.position[0], shape.item.position[1], cardZ(shape.index));
  card.rotation.set(0, 0, MathUtils.degToRad(shape.item.rotation));
  const pin = new Group();
  pin.position.set(...pinLocal(shape.item, spot));
  pin.rotation.set(...pinTilt(shape.item, spot));
  card.add(pin);
  card.updateMatrixWorld(true);
  return pin.matrixWorld;
};

const expectedByArea = () => {
  const expected = new Map<Area, Array<{ shape: CardShape; spot: CardShape["pins"][number] }>>();
  for (const shape of shapes) {
    for (const spot of shape.pins) expected.set(shape.item.area, [...(expected.get(shape.item.area) ?? []), { shape, spot }]);
  }
  return expected;
};

describe("pin placements", () => {
  const placements = pinPlacements(shapes);

  it("places every pin of every card once, grouped by the card's area", () => {
    const expected = expectedByArea();
    expect([...placements.keys()].sort()).toEqual([...expected.keys()].sort());
    for (const [area, matrices] of placements) expect(matrices).toHaveLength(expected.get(area)!.length);
  });

  it("puts each pin where it stood as a child of its card, needle along its axis", () => {
    for (const [area, pins] of expectedByArea()) {
      pins.forEach(({ shape, spot }, i) => {
        const matrix = placements.get(area)![i];
        const reference = asChildOfCard(shape, spot);
        matrix.elements.forEach((value, k) => expect(value).toBeCloseTo(reference.elements[k], 9));
        const needle = new Vector3().setFromMatrixColumn(matrix, 2);
        expect(needle.distanceTo(pinAxis(shape.item, spot))).toBeLessThan(1e-9);
      });
    }
  });
});
