import { createContactHandler } from "./handler.ts";
import { telegramSender } from "./telegram.ts";

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface ContactEnv {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  ALLOWED_ORIGIN: string;
  CONTACT_LIMITER: RateLimiter;
}

const worker = {
  async fetch(request: Request, env: ContactEnv): Promise<Response> {
    const handle = createContactHandler({
      send: telegramSender(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID),
      allow: async (client) => (await env.CONTACT_LIMITER.limit({ key: client })).success,
      allowedOrigin: env.ALLOWED_ORIGIN,
      log: (message) => console.error(message),
    });
    return handle(request, request.headers.get("cf-connecting-ip") ?? "unknown");
  },
};

export default worker;
