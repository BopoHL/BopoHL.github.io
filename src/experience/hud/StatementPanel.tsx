"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { playKeystroke } from "@/audio/typewriter";
import { CONTACT_ENDPOINT, sendStatement, type Delivery } from "@/contact/client";
import { checkStatement, STATEMENT_LIMITS, statementAsText, type StatementProblem } from "@/contact/statement";
import { contacts } from "@/content/profile";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import styles from "./statement.module.css";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "copied" } | { kind: Delivery } | { kind: "invalid"; problem: StatementProblem };

const telegram = contacts.find((contact) => contact.id === "telegram");

export function StatementPanel({ locale }: { locale: Locale }) {
  const open = useExperience((state) => state.statementOpen && state.mode === "explore");
  const draft = useExperience((state) => state.statement);
  const editStatement = useExperience((state) => state.editStatement);
  const openStatement = useExperience((state) => state.openStatement);
  const fileStatement = useExperience((state) => state.fileStatement);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [website, setWebsite] = useState("");
  const id = useId();
  const t = ui.statement;
  if (!open) return null;

  const type = (event: KeyboardEvent) => {
    if (event.key.length !== 1 && event.key !== "Enter" && event.key !== "Backspace") return;
    const state = useExperience.getState();
    state.strikeKey(event.key);
    if (state.soundOn) playKeystroke(state.variant.typing, event.key === " " ? "space" : "key");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const check = checkStatement({ ...draft, locale });
    if (!check.ok) {
      setStatus({ kind: "invalid", problem: check.problem });
      return;
    }
    if (!CONTACT_ENDPOINT) {
      void navigator.clipboard?.writeText(statementAsText(check.statement)).catch(() => {});
      if (telegram) window.open(telegram.href, "_blank", "noopener");
      setStatus({ kind: "copied" });
      return;
    }
    setStatus({ kind: "sending" });
    const delivery = await sendStatement(CONTACT_ENDPOINT, check.statement, website);
    if (delivery === "sent") fileStatement();
    setStatus({ kind: delivery });
  };

  const message =
    status.kind === "invalid"
      ? t.problems[status.problem][locale]
      : status.kind === "failed"
        ? `${t.failed[locale]} ${telegram?.value ?? ""}`
        : status.kind === "idle"
          ? ""
          : t[status.kind][locale];

  return (
    <aside className={styles.panel} aria-labelledby={`${id}-title`} data-lenis-prevent>
      <header className={styles.head}>
        <p className={styles.kicker}>{t.kicker[locale]}</p>
        <button type="button" className={styles.close} onClick={() => openStatement(false)} aria-label={t.close[locale]}>
          ×
        </button>
      </header>
      <h2 id={`${id}-title`} className={styles.title}>
        {t.title[locale]}
      </h2>
      <p className={styles.intro}>{CONTACT_ENDPOINT ? t.intro[locale] : t.introOffline[locale]}</p>
      <form className={styles.form} onSubmit={submit} noValidate>
        <label className={styles.field}>
          <span>{t.name[locale]}</span>
          <input
            value={draft.name}
            maxLength={STATEMENT_LIMITS.name}
            placeholder={t.namePlaceholder[locale]}
            autoComplete="name"
            onKeyDown={type}
            onChange={(event) => editStatement({ name: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span>{t.contact[locale]}</span>
          <input
            value={draft.contact}
            maxLength={STATEMENT_LIMITS.contact}
            placeholder={t.contactPlaceholder[locale]}
            autoComplete="email"
            required
            onKeyDown={type}
            onChange={(event) => editStatement({ contact: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span>{t.message[locale]}</span>
          <textarea
            value={draft.message}
            maxLength={STATEMENT_LIMITS.message}
            rows={5}
            required
            onKeyDown={type}
            onChange={(event) => editStatement({ message: event.target.value })}
          />
        </label>
        <input
          className={styles.trap}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          name="website"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
        <button type="submit" className={styles.submit} disabled={status.kind === "sending"}>
          {CONTACT_ENDPOINT ? t.submit[locale] : t.submitOffline[locale]}
        </button>
        <p className={styles.status} role="status" aria-live="polite">
          {message}
        </p>
      </form>
    </aside>
  );
}
