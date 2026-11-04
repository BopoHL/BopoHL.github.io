import { describe, expect, it } from "vitest";
import { evidence } from "../board";
import { caseFileFor, caseFiles } from "../caseFiles";

describe("case files", () => {
  it("only point at evidence that is on the board", () => {
    const ids = new Set(evidence.map((item) => item.id));
    for (const file of caseFiles) for (const id of file.evidence) expect(ids.has(id), `${file.id} → ${id}`).toBe(true);
  });

  it("give each piece of evidence at most one file", () => {
    const seen = caseFiles.flatMap((file) => file.evidence);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("wire flow diagrams between known nodes", () => {
    for (const file of caseFiles) {
      if (file.figure?.kind !== "flow") continue;
      const nodes = new Set(file.figure.nodes.map((node) => node.id));
      for (const [from, to] of file.figure.links) expect(nodes.has(from) && nodes.has(to), `${file.id}: ${from}→${to}`).toBe(true);
    }
  });

  it("finds the file for a card", () => {
    expect(caseFileFor("dmed-clip")?.id).toBe("dmed");
    expect(caseFileFor("mugshot")).toBeUndefined();
    expect(caseFileFor(null)).toBeUndefined();
  });
});
