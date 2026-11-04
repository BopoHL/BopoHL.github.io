import { checkStatement } from "../../src/contact/statement.ts";
import { formatStatement, type Send } from "./telegram.ts";

const MAX_BODY_BYTES = 8 * 1024;
const PATH = "/contact";

export type Allow = (client: string) => Promise<boolean>;

export interface ContactHandlerOptions {
  send: Send;
  allow: Allow;
  allowedOrigin: string;
  log?: (message: string) => void;
}

const isBot = (payload: unknown) =>
  typeof payload === "object" && payload !== null && "website" in payload && Boolean((payload as { website: unknown }).website);

export const createContactHandler = ({ send, allow, allowedOrigin, log = () => {} }: ContactHandlerOptions) => {
  const cors = { "access-control-allow-origin": allowedOrigin, vary: "origin" };
  const reply = (status: number, body?: object) =>
    body
      ? new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json; charset=utf-8" } })
      : new Response(null, { status, headers: cors });

  return async (request: Request, client: string): Promise<Response> => {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type",
          "access-control-max-age": "86400",
        },
      });
    }
    if (request.method !== "POST" || new URL(request.url).pathname !== PATH) return reply(404, { error: "not-found" });
    if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return reply(413, { error: "too-large" });
    if (!(await allow(client))) return reply(429, { error: "slow-down" });

    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) return reply(413, { error: "too-large" });
    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      return reply(400, { error: "format" });
    }
    if (isBot(payload)) return reply(204);
    const check = checkStatement(payload);
    if (!check.ok) return reply(400, { error: check.problem });

    try {
      await send(formatStatement(check.statement));
      return reply(204);
    } catch (error) {
      log(`Telegram delivery failed: ${error instanceof Error ? error.message : String(error)}`);
      return reply(502, { error: "delivery" });
    }
  };
};
