import { l } from "./localize";
import type { Contact } from "./types";

export const CASE_NUMBER = "404";

export const profile = {
  name: l("Леонид Воронин", "Leonid Voronin"),
  role: l("Backend-разработчик, PHP / Laravel", "Backend developer, PHP / Laravel"),
  location: l("Ташкент, удалённо или гибрид", "Tashkent, remote or hybrid"),
};

export const RESUME_PATH = "/cv/leonid-voronin-cv-ru.pdf";

export const contacts: Contact[] = [
  {
    id: "telegram",
    label: l("Telegram", "Telegram"),
    value: "@BopoH_L",
    href: "https://t.me/BopoH_L",
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
  },
  {
    id: "resume",
    label: l("Резюме, PDF", "Résumé, PDF"),
    value: "PDF",
    href: RESUME_PATH,
  },
];
