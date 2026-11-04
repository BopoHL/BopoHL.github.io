import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { SlidingWindowLimiter } from "../rateLimit";
import { createContactServer } from "../server";
import { formatStatement, type Send } from "../telegram";

const servers: Array<ReturnType<typeof createContactServer>> = [];

const ignore: Send = async () => {};

const start = async (send: Send = ignore, limit = 5) => {
  const server = createContactServer({ send, limiter: new SlidingWindowLimiter(limit, 60_000), allowedOrigin: "https://case404.dev" });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}/contact`;
};

const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

describe("contact handler", () => {
  it("forwards a valid statement to Telegram", async () => {
    const sent: string[] = [];
    const url = await start(async (text) => {
      sent.push(text);
    });
    const response = await post(url, { name: "Anna", contact: "@anna", message: "We have a backend role.", locale: "en" });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://case404.dev");
    expect(sent).toEqual([formatStatement({ name: "Anna", contact: "@anna", message: "We have a backend role.", locale: "en" })]);
  });

  it("rejects an incomplete statement", async () => {
    const url = await start();
    const response = await post(url, { contact: "", message: "Hello there" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "contact" });
  });

  it("quietly drops bots that fill the hidden field", async () => {
    const sent: string[] = [];
    const url = await start(async (text) => {
      sent.push(text);
    });
    const response = await post(url, { contact: "@bot", message: "Buy now!", website: "spam.example" });
    expect(response.status).toBe(204);
    expect(sent).toEqual([]);
  });

  it("slows down a flood from one address", async () => {
    const url = await start(async () => {}, 2);
    const statement = { contact: "@anna", message: "Hello there" };
    expect((await post(url, statement)).status).toBe(204);
    expect((await post(url, statement)).status).toBe(204);
    expect((await post(url, statement)).status).toBe(429);
  });

  it("reports a failed delivery", async () => {
    const url = await start(async () => {
      throw new Error("down");
    });
    expect((await post(url, { contact: "@anna", message: "Hello there" })).status).toBe(502);
  });

  it("answers the CORS preflight", async () => {
    const url = await start();
    const response = await fetch(url, { method: "OPTIONS" });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
  });
});

describe("rate limiter", () => {
  it("lets requests through again once the window passes", () => {
    let now = 0;
    const limiter = new SlidingWindowLimiter(1, 1000, () => now);
    expect(limiter.allow("a")).toBe(true);
    expect(limiter.allow("a")).toBe(false);
    expect(limiter.allow("b")).toBe(true);
    now = 1001;
    expect(limiter.allow("a")).toBe(true);
  });
});
