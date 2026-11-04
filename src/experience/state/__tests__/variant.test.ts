import { describe, expect, it } from "vitest";
import { DEFAULT_VARIANT, pilotRequested, variantFromQuery, variantToQuery, type PilotVariant } from "../variant";

describe("pilot variant query", () => {
  it("round-trips every axis through the URL", () => {
    const variant: PilotVariant = { finale: "folder", explore: false, palette: "mono", camera: "classic", typing: "metal", pins: "map" };
    expect(variantFromQuery(variantToQuery(variant))).toEqual(variant);
  });

  it("keeps the pilot panel reachable only when asked for", () => {
    expect(pilotRequested(variantToQuery(DEFAULT_VARIANT, true))).toBe(true);
    expect(pilotRequested(variantToQuery(DEFAULT_VARIANT))).toBe(false);
    expect(pilotRequested("?pilot")).toBe(true);
  });

  it("falls back to defaults for unknown values", () => {
    expect(variantFromQuery("?look=sepia&camera=drone&typing=piano&pins=nail")).toEqual(DEFAULT_VARIANT);
  });
});
