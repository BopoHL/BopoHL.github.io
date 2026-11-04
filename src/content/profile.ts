import { l } from "./localize";
import type { Contact, EvidenceImage } from "./types";

export const CASE_NUMBER = "404";

export const profile = {
  name: l("Леонид Воронин", "Leonid Voronin"),
  role: l("Backend-разработчик, PHP / Laravel", "Backend developer, PHP / Laravel"),
  location: l("Ташкент, удалённо или гибрид", "Tashkent, remote or hybrid"),
};

export const portrait: EvidenceImage = { scene: "portrait" };

export const resume = {
  label: l("Резюме, PDF", "Résumé, PDF"),
  href: l("/cv/leonid-voronin-cv-ru.pdf", "/cv/leonid-voronin-cv-en.pdf"),
};

export const contacts: Contact[] = [
  {
    id: "telegram",
    label: l("Telegram", "Telegram"),
    value: "@BopoH_L",
    href: "https://t.me/BopoH_L",
    copy: "@BopoH_L",
  },
  {
    id: "linkedin",
    label: l("LinkedIn", "LinkedIn"),
    value: "in/leonidvoronin",
    href: "https://www.linkedin.com/in/leonidvoronin/",
  },
  {
    id: "email",
    label: l("Почта", "Email"),
    value: "vlo99@yandex.ru",
    href: "mailto:vlo99@yandex.ru",
    copy: "vlo99@yandex.ru",
  },
  {
    id: "github",
    label: l("GitHub", "GitHub"),
    value: "BopoHL",
    href: "https://github.com/BopoHL",
  },
];
