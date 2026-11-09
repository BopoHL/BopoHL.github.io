import { describe, expect, it } from "vitest";
import { checkStatement, STATEMENT_LIMITS } from "../statement";

describe("checkStatement", () => {
  it("accepts a statement and tidies it up", () => {
    const check = checkStatement({ name: "  Anna ", contact: "@anna\u0007", message: "Hello, we have a role for you.", locale: "ru" });
    expect(check).toEqual({
      ok: true,
      statement: { name: "Anna", contact: "@anna", message: "Hello, we have a role for you.", locale: "ru" },
    });
  });

  it("keeps line breaks in the message", () => {
    const check = checkStatement({ contact: "a@b.c", message: "line one\nline two" });
    expect(check.ok && check.statement.message).toBe("line one\nline two");
  });

  it("keeps the name and contact on one line", () => {
    const check = checkStatement({ name: "Anna\r\nHR", contact: "@anna\n\tor mail", message: "Hello there" });
    expect(check.ok && [check.statement.name, check.statement.contact]).toEqual(["Anna HR", "@anna or mail"]);
  });

  it("needs a way to answer and something to say", () => {
    expect(checkStatement({ contact: " ", message: "Hello there" })).toEqual({ ok: false, problem: "contact" });
    expect(checkStatement({ contact: "@anna", message: "hi" })).toEqual({ ok: false, problem: "message" });
  });

  it("refuses oversized fields and non-objects", () => {
    expect(checkStatement({ contact: "@anna", message: "x".repeat(STATEMENT_LIMITS.message + 1) })).toEqual({
      ok: false,
      problem: "too-long",
    });
    expect(checkStatement("hello")).toEqual({ ok: false, problem: "format" });
  });

  it("falls back to English for unknown locales", () => {
    const check = checkStatement({ contact: "@anna", message: "Hello there", locale: "de" });
    expect(check.ok && check.statement.locale).toBe("en");
  });
});
