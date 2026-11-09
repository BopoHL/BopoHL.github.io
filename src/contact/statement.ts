export const STATEMENT_LIMITS = { name: 80, contact: 120, message: 2000, minMessage: 5 } as const;

export type StatementLocale = "ru" | "en";

export interface StatementDraft {
  name: string;
  contact: string;
  message: string;
}

export interface Statement extends StatementDraft {
  locale: StatementLocale;
}

export type StatementProblem = "contact" | "message" | "too-long" | "format";

export type StatementCheck = { ok: true; statement: Statement } | { ok: false; problem: StatementProblem };

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

const LINE_BREAKS = /\s*[\r\n\t]+\s*/g;

const clean = (value: unknown) => (typeof value === "string" ? value.replace(CONTROL_CHARACTERS, "").trim() : "");
const cleanLine = (value: unknown) => clean(value).replace(LINE_BREAKS, " ");

export const checkStatement = (input: unknown): StatementCheck => {
  if (typeof input !== "object" || input === null) return { ok: false, problem: "format" };
  const fields = input as Record<string, unknown>;
  const statement: Statement = {
    name: cleanLine(fields.name),
    contact: cleanLine(fields.contact),
    message: clean(fields.message),
    locale: fields.locale === "ru" ? "ru" : "en",
  };
  if (
    statement.name.length > STATEMENT_LIMITS.name ||
    statement.contact.length > STATEMENT_LIMITS.contact ||
    statement.message.length > STATEMENT_LIMITS.message
  ) {
    return { ok: false, problem: "too-long" };
  }
  if (statement.contact.length === 0) return { ok: false, problem: "contact" };
  if (statement.message.length < STATEMENT_LIMITS.minMessage) return { ok: false, problem: "message" };
  return { ok: true, statement };
};

export const statementAsText = ({ name, contact, message }: Statement) =>
  [name ? `${name}, ${contact}` : contact, "", message].join("\n");
