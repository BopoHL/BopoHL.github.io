import { CopyButton } from "@/components/CopyButton";
import { dossierLanguages, dossierSections, dossierSkills, dossierSummary } from "@/content/dossier";
import { pick } from "@/content/localize";
import { contacts, profile, resume } from "@/content/profile";
import type { Locale } from "@/content/types";
import { ui } from "@/content/ui";
import styles from "./dossier.module.css";

export function DossierContent({ locale }: { locale: Locale }) {
  return (
    <article className={styles.sheet}>
      <header className={styles.header}>
        <h1 id="dossier-title" className={styles.name}>
          {profile.name[locale]}
        </h1>
        <p className={styles.role}>{profile.role[locale]}</p>
        <p className={styles.location}>{profile.location[locale]}</p>
        <a className={styles.download} href={pick(resume.href, locale)} download>
          {ui.dossier.download[locale]}
        </a>
      </header>

      <section className={styles.section} aria-labelledby="dossier-summary">
        <h2 id="dossier-summary" className={styles.sectionTitle}>
          {ui.dossier.summary[locale]}
        </h2>
        <p className={styles.summary}>{dossierSummary[locale]}</p>
      </section>

      {dossierSections.map((section) => (
        <section key={section.id} className={styles.section} aria-labelledby={`dossier-${section.id}`}>
          <h2 id={`dossier-${section.id}`} className={styles.sectionTitle}>
            {section.title[locale]}
          </h2>
          {section.entries.map((entry) => (
            <div key={`${entry.place.en}-${entry.title.en}`} className={styles.entry}>
              <div className={styles.entryHead}>
                <h3 className={styles.entryTitle}>{entry.title[locale]}</h3>
                <p className={styles.period}>{entry.period[locale]}</p>
              </div>
              <p className={styles.place}>{entry.place[locale]}</p>
              {entry.points[locale].length > 0 ? (
                <ul className={styles.points}>
                  {entry.points[locale].map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </section>
      ))}

      <div className={styles.columns}>
        <section className={styles.section} aria-labelledby="dossier-skills">
          <h2 id="dossier-skills" className={styles.sectionTitle}>
            {ui.dossier.skills[locale]}
          </h2>
          <ul className={styles.points}>
            {dossierSkills[locale].map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>
        <section className={styles.section} aria-labelledby="dossier-languages">
          <h2 id="dossier-languages" className={styles.sectionTitle}>
            {ui.dossier.languages[locale]}
          </h2>
          <ul className={styles.points}>
            {dossierLanguages[locale].map((language) => (
              <li key={language}>{language}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className={styles.section} aria-labelledby="dossier-contacts">
        <h2 id="dossier-contacts" className={styles.sectionTitle}>
          {ui.dossier.contacts[locale]}
        </h2>
        <ul className={styles.contactList}>
          {contacts.map((contact) => (
            <li key={contact.id}>
              <span>{contact.label[locale]}</span>
              <span className={styles.contactValue}>
                <a href={contact.href} target={contact.id === "email" ? undefined : "_blank"} rel="noopener">
                  {contact.value}
                </a>
                {contact.copy ? <CopyButton text={contact.copy} locale={locale} /> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
