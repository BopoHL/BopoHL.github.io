import { describe, expect, it } from "vitest";
import { DEFAULT_VARIANT, variantFromQuery, variantToQuery, type PilotVariant } from "../variant";

describe("pilot variant query", () => {
  it("round-trips every axis through the URL", () => {
    const variant: PilotVariant = { finale: "folder", explore: false, palette: "mono", camera: "classic", typing: "metal" };
    expect(variantFromQuery(variantToQuery(variant))).toEqual(variant);
  });

  it("falls back to defaults for unknown values", () => {
    expect(variantFromQuery("?look=sepia&camera=drone&typing=piano")).toEqual(DEFAULT_VARIANT);
  });
});
