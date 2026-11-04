import { describe, expect, it } from "vitest";
import { createContactHandler, type Allow } from "../handler";
import { formatStatement, type Send } from "../telegram";

const ORIGIN = "https://bopohl.github.io";
const URL = "https://case404-contact.example.workers.dev/contact";

const ignore: Send = async () => {};
const always: Allow = async () => true;

const handler = (send: Send = ignore, allow: Allow = always) => createContactHandler({ send, allow, allowedOrigin: ORIGIN });

const post = (body: unknown, url = URL) =>
  new Request(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("contact handler", () => {
  it("forwards a valid statement to Telegram", async () => {
    const sent: string[] = [];
    const statement = { name: "Anna", contact: "@anna", message: "We have a backend role.", locale: "en" } as const;
    const response = await handler(async (text) => {
      sent.push(text);
    })(post(statement), "1.2.3.4");
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    expect(sent).toEqual([formatStatement(statement)]);
  });

  it("rejects an incomplete statement", async () => {
    const response = await handler()(post({ contact: "", message: "Hello there" }), "1.2.3.4");
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "contact" });
  });

  it("rejects a body that is not JSON", async () => {
    const request = new Request(URL, { method: "POST", body: "not json" });
    expect((await handler()(request, "1.2.3.4")).status).toBe(400);
  });

  it("refuses an oversized body", async () => {
    const response = await handler()(post({ contact: "@anna", message: "x".repeat(9000) }), "1.2.3.4");
    expect(response.status).toBe(413);
  });

  it("quietly drops bots that fill the hidden field", async () => {
    const sent: string[] = [];
    const response = await handler(async (text) => {
      sent.push(text);
    })(post({ contact: "@bot", message: "Buy now!", website: "spam.example" }), "1.2.3.4");
    expect(response.status).toBe(204);
    expect(sent).toEqual([]);
  });

  it("slows down an address the limiter turns away", async () => {
    const seen: string[] = [];
    const allow: Allow = async (client) => {
      seen.push(client);
      return false;
    };
    const response = await handler(ignore, allow)(post({ contact: "@anna", message: "Hello there" }), "5.6.7.8");
    expect(response.status).toBe(429);
    expect(seen).toEqual(["5.6.7.8"]);
  });

  it("reports a failed delivery", async () => {
    const response = await handler(async () => {
      throw new Error("down");
    })(post({ contact: "@anna", message: "Hello there" }), "1.2.3.4");
    expect(response.status).toBe(502);
  });

  it("answers the CORS preflight", async () => {
    const response = await handler()(new Request(URL, { method: "OPTIONS" }), "1.2.3.4");
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
    expect(response.headers.get("access-control-allow-origin")).toBe(ORIGIN);
  });

  it("ignores other paths and methods", async () => {
    expect((await handler()(post({}, "https://case404-contact.example.workers.dev/"), "1.2.3.4")).status).toBe(404);
    expect((await handler()(new Request(URL), "1.2.3.4")).status).toBe(404);
  });
});
