"use client";

import { pick } from "@/content/localize";
import { contacts, profile } from "@/content/profile";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import { useExperience } from "../state/store";
import styles from "./hud.module.css";
import { useRevealSound } from "./useRevealSound";

export function FinaleCard({ locale }: { locale: Locale }) {
  const revealed = useExperience((state) => state.revealed);
  const mode = useExperience((state) => state.mode);
  const exploreEnabled = useExperience((state) => state.variant.explore);
  const setMode = useExperience((state) => state.setMode);
  const setDossierOpen = useExperience((state) => state.setDossierOpen);
  const visible = revealed && mode === "route";
  const resume = contacts.find((contact) => contact.id === "resume");
  useRevealSound();

  return (
    <section className={`${styles.finale} ${visible ? styles.finaleVisible : ""}`} aria-hidden={!visible} inert={!visible}>
      <h2 className={styles.finaleName}>{pick(profile.name, locale)}</h2>
      <p className={styles.finaleRole}>{pick(profile.role, locale)}</p>
      <ul className={styles.contacts}>
        {contacts
          .filter((contact) => contact.id !== "resume")
          .map((contact) => (
            <li key={contact.id}>
              <span className={styles.contactLabel}>{contact.label[locale]}</span>
              <a href={contact.href} target={contact.id === "email" ? undefined : "_blank"} rel="noopener">
                {contact.value}
              </a>
            </li>
          ))}
      </ul>
      <div className={styles.actions}>
        {resume ? (
          <a className={styles.primary} href={resume.href} download>
            {ui.dossier.download[locale]}
          </a>
        ) : null}
        <button type="button" className={styles.secondary} onClick={() => setDossierOpen(true)}>
          {ui.dossier.title[locale]}
        </button>
        {exploreEnabled ? (
          <button type="button" className={styles.secondary} onClick={() => setMode("explore")}>
            {ui.explore[locale]}
          </button>
        ) : null}
      </div>
    </section>
  );
}
