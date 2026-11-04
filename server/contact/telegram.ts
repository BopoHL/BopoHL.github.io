import type { Statement } from "../../src/contact/statement.ts";

export type Send = (text: string) => Promise<void>;

const HEADER = { ru: "Новые показания с сайта", en: "New statement from the site" } as const;

export const formatStatement = ({ name, contact, message, locale }: Statement) =>
  [`📨 ${HEADER[locale]}`, `${name || "—"} · ${contact}`, "", message].join("\n");

export const telegramSender =
  (token: string, chatId: string, fetchImpl: typeof fetch = fetch): Send =>
  async (text) => {
    const response = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!response.ok) throw new Error(`Telegram answered ${response.status}`);
  };
