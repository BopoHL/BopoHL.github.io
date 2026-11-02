import { HERALD } from "./board";
import { l } from "./localize";
import { contacts } from "./profile";
import type { Evidence } from "./types";

const telegram = contacts.find((contact) => contact.id === "telegram");
if (!telegram) throw new Error("Profile has no Telegram contact for the desk note");

export const deskEvidence: Evidence[] = [
  {
    id: "desk-contact",
    kind: "sticky",
    area: "case",
    position: [-1.9, 1.5],
    rotation: -9,
    width: 1.8,
    text: l(`Связь: Telegram ${telegram.value}`, `Contact: Telegram ${telegram.value}`),
  },
  {
    id: "desk-hiring",
    kind: "newspaper",
    area: "case",
    position: [0.4, 3.0],
    rotation: 8,
    width: 3.4,
    aspect: 0.86,
    masthead: HERALD,
    dateline: l("Ташкент, 2026", "Tashkent, 2026"),
    headline: l("Подозреваемый открыт к новым делам", "Suspect open to new cases"),
    body: l(
      "По данным редакции, backend-разработчик (PHP, Laravel) рассматривает удалённую работу и предложения в СНГ. Выйти на связь можно через Telegram.",
      "According to our sources, the backend developer (PHP, Laravel) is open to remote work and offers across the CIS. He can be reached on Telegram.",
    ),
    ink: l(
      {
        marks: [
          { phrase: "удалённую работу", stroke: "circle", tool: "marker" },
          { phrase: "Telegram", stroke: "underline", tool: "marker" },
        ],
      },
      {
        marks: [
          { phrase: "remote work", stroke: "circle", tool: "marker" },
          { phrase: "Telegram", stroke: "underline", tool: "marker" },
        ],
      },
    ),
  },
  {
    id: "desk-github",
    kind: "scrap",
    area: "case",
    position: [4.7, 1.4],
    rotation: 6,
    width: 2.4,
    text: l("GitHub: BopoHL — проверить коммиты", "GitHub: BopoHL — check the commits"),
  },
  {
    id: "desk-interrogation",
    kind: "typed",
    area: "case",
    paper: "sheet",
    position: [3.7, 4.3],
    rotation: -12,
    width: 3,
    aspect: 1.2,
    title: l("ПРОТОКОЛ ДОПРОСА", "INTERROGATION RECORD"),
    subtitle: l("Лист 2", "Sheet 2"),
    lines: l(
      [
        "Языки: русский, английский (C1), испанский — учит",
        "Базы: PostgreSQL, MySQL, Redis",
        "Инфраструктура: Docker, Kubernetes, Grafana",
        "Подход: DDD, CQRS, микросервисы",
      ],
      [
        "Languages: Russian, English (C1), learning Spanish",
        "Databases: PostgreSQL, MySQL, Redis",
        "Infrastructure: Docker, Kubernetes, Grafana",
        "Approach: DDD, CQRS, microservices",
      ],
    ),
    ink: l(
      { marks: [{ phrase: "C1", stroke: "circle", tool: "pen" }] },
      { marks: [{ phrase: "C1", stroke: "circle", tool: "pen" }] },
    ),
  },
  {
    id: "desk-highload",
    kind: "newspaper",
    area: "case",
    position: [-0.6, 6.5],
    rotation: -5,
    width: 2.7,
    aspect: 0.62,
    masthead: HERALD,
    dateline: l("Ташкент", "Tashkent"),
    headline: l("Highload без перебоев", "Highload without hiccups"),
    body: l(
      "Неизвестный специалист уже 2,5 года оптимизирует запросы и интеграции в финтехе и медтехе.",
      "For 2.5 years an unnamed specialist has been tuning queries and integrations in fintech and medtech.",
    ),
    ink: l(
      { marks: [{ phrase: "2,5 года", stroke: "underline", tool: "marker" }] },
      { marks: [{ phrase: "2.5 years", stroke: "underline", tool: "marker" }] },
    ),
  },
  {
    id: "desk-photo",
    kind: "photo",
    area: "case",
    frame: "polaroid",
    position: [5.8, 6.9],
    rotation: 16,
    width: 2.2,
    image: { scene: "busStop" },
    caption: l("Ташкент", "Tashkent"),
  },
];
