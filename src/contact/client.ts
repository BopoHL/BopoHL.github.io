import type { Statement } from "./statement";

export type Delivery = "sent" | "slow" | "failed";

export const CONTACT_ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || null;

export const sendStatement = async (endpoint: string, statement: Statement, website: string): Promise<Delivery> => {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...statement, website }),
    });
    if (response.ok) return "sent";
    return response.status === 429 ? "slow" : "failed";
  } catch {
    return "failed";
  }
};
