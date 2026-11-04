import { SlidingWindowLimiter } from "./rateLimit.ts";
import { createContactServer } from "./server.ts";
import { telegramSender } from "./telegram.ts";

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} for the contact handler`);
  return value;
};

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";
const RATE = { messages: 3, windowMs: 10 * 60 * 1000 };

const server = createContactServer({
  send: telegramSender(required("TELEGRAM_BOT_TOKEN"), required("TELEGRAM_CHAT_ID")),
  limiter: new SlidingWindowLimiter(RATE.messages, RATE.windowMs),
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? "*",
  log: (message) => console.error(message),
});

server.listen(port, host, () => console.log(`Contact handler listening on http://${host}:${port}/contact`));
