import { dossierLanguages, dossierSections, dossierSkills, dossierSummary } from "@/content/dossier";
import { pick } from "@/content/localize";
import { contacts, profile } from "@/content/profile";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import styles from "./resume.module.css";

const printedSections = dossierSections.filter((section) => !section.siteOnly);

export function ResumePrint({ locale }: { locale: Locale }) {
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.name}>{pick(profile.name, locale)}</h1>
          <p className={styles.role}>{pick(profile.role, locale)}</p>
          <p className={styles.location}>{pick(profile.location, locale)}</p>
        </div>
        <ul className={styles.contacts}>
          {contacts.map((contact) => (
            <li key={contact.id}>
              <span className={styles.label}>{pick(contact.label, locale)}</span>
              <a href={contact.href}>{contact.value}</a>
            </li>
          ))}
        </ul>
      </header>

      <section className={styles.section}>
        <h2 className={styles.heading}>{pick(ui.dossier.summary, locale)}</h2>
        <p className={styles.summary}>{pick(dossierSummary, locale)}</p>
      </section>

      {printedSections.map((section) => (
        <section key={section.id} className={styles.section}>
          <h2 className={styles.heading}>{pick(section.title, locale)}</h2>
          {section.entries.map((entry) => (
            <div key={`${entry.place.en}-${entry.title.en}`} className={styles.entry}>
              <div className={styles.entryHead}>
                <h3 className={styles.entryTitle}>
                  {pick(entry.title, locale)} <span className={styles.place}>· {pick(entry.place, locale)}</span>
                </h3>
                {entry.period ? <p className={styles.period}>{pick(entry.period, locale)}</p> : null}
              </div>
              {pick(entry.points, locale).length > 0 ? (
                <ul className={styles.points}>
                  {pick(entry.points, locale).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </section>
      ))}

      <div className={styles.columns}>
        <section className={styles.section}>
          <h2 className={styles.heading}>{pick(ui.dossier.skills, locale)}</h2>
          <ul className={styles.points}>
            {pick(dossierSkills, locale).map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>
        <section className={styles.section}>
          <h2 className={styles.heading}>{pick(ui.dossier.languages, locale)}</h2>
          <ul className={styles.points}>
            {pick(dossierLanguages, locale).map((language) => (
              <li key={language}>{language}</li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
