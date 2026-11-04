import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { checkStatement } from "../../src/contact/statement.ts";
import type { SlidingWindowLimiter } from "./rateLimit.ts";
import { formatStatement, type Send } from "./telegram.ts";

const MAX_BODY_BYTES = 8 * 1024;

export interface ContactServerOptions {
  send: Send;
  limiter: SlidingWindowLimiter;
  allowedOrigin: string;
  log?: (message: string) => void;
}

const clientAddress = (request: IncomingMessage) =>
  String(request.headers["x-real-ip"] ?? request.socket.remoteAddress ?? "unknown");

const readBody = (request: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("too-large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });

const respond = (response: ServerResponse, status: number, body?: object) => {
  response.statusCode = status;
  if (body) {
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(JSON.stringify(body));
  } else {
    response.end();
  }
};

export const createContactServer = ({ send, limiter, allowedOrigin, log = () => {} }: ContactServerOptions) =>
  createServer(async (request, response) => {
    response.setHeader("access-control-allow-origin", allowedOrigin);
    response.setHeader("vary", "origin");
    if (request.method === "OPTIONS") {
      response.setHeader("access-control-allow-methods", "POST, OPTIONS");
      response.setHeader("access-control-allow-headers", "content-type");
      response.setHeader("access-control-max-age", "86400");
      return respond(response, 204);
    }
    if (request.method !== "POST" || !request.url?.endsWith("/contact")) return respond(response, 404, { error: "not-found" });
    if (!limiter.allow(clientAddress(request))) return respond(response, 429, { error: "slow-down" });

    let payload: unknown;
    try {
      payload = JSON.parse(await readBody(request));
    } catch {
      return respond(response, 400, { error: "format" });
    }
    if (typeof payload === "object" && payload !== null && "website" in payload && (payload as { website: unknown }).website) {
      return respond(response, 204);
    }
    const check = checkStatement(payload);
    if (!check.ok) return respond(response, 400, { error: check.problem });

    try {
      await send(formatStatement(check.statement));
      return respond(response, 204);
    } catch (error) {
      log(`Telegram delivery failed: ${error instanceof Error ? error.message : String(error)}`);
      return respond(response, 502, { error: "delivery" });
    }
  });
