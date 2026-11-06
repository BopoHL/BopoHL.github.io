import { describe, expect, it } from "vitest";
import { jsonLd, personSchema } from "../personSchema";

describe("personSchema", () => {
  it("describes the developer with public profiles and an absolute url", () => {
    const schema = personSchema("en");
    expect(schema["@type"]).toBe("Person");
    expect(schema.name).toBe("Leonid Voronin");
    expect(schema.url).toMatch(/^https?:\/\/.+\/en\/$/);
    expect(schema.sameAs).toContain("https://github.com/BopoHL");
    expect(schema.sameAs.every((href) => href.startsWith("https://"))).toBe(true);
    expect(schema.knowsAbout).toContain("Laravel");
    expect(schema.knowsAbout).toContain("FastAPI");
    expect(schema.knowsAbout).not.toContain("in side projects");
    expect(schema.knowsLanguage).toEqual(["Russian", "English", "Spanish"]);
    expect(schema.image).toMatch(/\/evidence\/portrait\.jpg$/);
    expect(schema.alumniOf.name).toBe("IT Park University");
  });

  it("cannot be broken out of its script tag", () => {
    expect(jsonLd({ text: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });
});
