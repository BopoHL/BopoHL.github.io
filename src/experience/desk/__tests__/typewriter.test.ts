import { describe, expect, it } from "vitest";
import { KEY_ROWS, keyIndexFor, keySpots } from "../typewriterModel";

describe("typewriter keys", () => {
  it("lays out every key once in rows from back to front", () => {
    const spots = keySpots("ru");
    expect(spots).toHaveLength(KEY_ROWS.ru.join("").length);
    const zs = KEY_ROWS.ru.map((row) => spots.find((spot) => spot.char === row[0])!.position[2]);
    expect([...zs].sort((a, b) => a - b)).toEqual(zs);
  });

  it("gives each key its own cell in the letter atlas", () => {
    const cells = keySpots("en").map(({ cell }) => cell.join(":"));
    expect(new Set(cells).size).toBe(cells.length);
  });

  it("finds the key for a typed letter in either case", () => {
    const spots = keySpots("ru");
    expect(spots[keyIndexFor(spots, "ж")!].char).toBe("Ж");
    expect(keyIndexFor(spots, "?")).toBeNull();
  });
});
