import { describe, expect, it } from "vitest";
import { BOARD_SIZE } from "../board";
import { boundsOf } from "../geometry";
import { boardContentFor, validateBoardContent } from "../selectors";
import type { FinaleVariant } from "../types";

const variants: FinaleVariant[] = ["reveal", "folder"];

describe.each(variants)("board content for %s finale", (variant) => {
  const content = boardContentFor(variant);

  it("references only existing evidence and stations", () => {
    expect(validateBoardContent(content)).toEqual([]);
  });

  it("keeps every piece of evidence on the board", () => {
    const halfWidth = BOARD_SIZE.width / 2;
    const halfHeight = BOARD_SIZE.height / 2;
    const outside = content.evidence
      .filter((item) => {
        const b = boundsOf(item);
        return b.minX < -halfWidth || b.maxX > halfWidth || b.minY < -halfHeight || b.maxY > halfHeight;
      })
      .map((item) => item.id);
    expect(outside).toEqual([]);
  });

  it("ends with the finale station", () => {
    expect(content.stations.at(-1)?.id).toBe("finale");
  });
});
