import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { narrationFor } from "../narration";
import { stationsFor } from "../route";
import { LOCALES } from "../types";

describe("narration", () => {
  it("has a recorded line for every station in every language", () => {
    const missing = (["reveal", "folder"] as const)
      .flatMap((variant) => stationsFor(variant))
      .flatMap((station) => LOCALES.map((locale) => narrationFor(station.id, locale)))
      .filter((src) => !existsSync(join(process.cwd(), "public", src)));
    expect(missing).toEqual([]);
  });
});
