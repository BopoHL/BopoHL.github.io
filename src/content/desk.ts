import { HERALD } from "./board";
import { l } from "./localize";
import { contacts } from "./profile";
import type { Evidence, Localized } from "./types";

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
      "Неизвестный специалист уже 3 года оптимизирует запросы и интеграции в финтехе и медтехе.",
      "For 3 years an unnamed specialist has been tuning queries and integrations in fintech and medtech.",
    ),
    ink: l(
      { marks: [{ phrase: "3 года", stroke: "underline", tool: "marker" }] },
      { marks: [{ phrase: "3 years", stroke: "underline", tool: "marker" }] },
    ),
  },
  {
    id: "desk-photo",
    kind: "photo",
    area: "case",
    frame: "polaroid",
    position: [5.3, 7.0],
    rotation: 16,
    width: 2.2,
    image: { scene: "busStop" },
    caption: l("Ташкент", "Tashkent"),
  },
];

export const cassette = {
  title: l("Дело № 404", "Case № 404"),
  note: l("музыка для допроса", "music for the interrogation"),
  side: l("СТОРОНА А", "SIDE A"),
  brand: l("ПРОТОКОЛ", "PROTOCOL"),
  model: l("МК-404", "MK-404"),
  recording: { src: "/audio/case-404.mp3", seconds: 77.9 },
};

export type SecretKind = "matchbook" | "ticket" | "bib" | "note";

export interface Secret {
  id: string;
  kind: SecretKind;
  at: [number, number];
  yaw: number;
  print: Localized<string[]>;
  reveal: Localized;
}

export const secrets: Secret[] = [
  {
    id: "matchbook",
    kind: "matchbook",
    at: [4.0, 8.15],
    yaw: -24,
    print: l(["БАР «НУАР»", "Ташкент", "UTC+5"], ["NOIR BAR", "Tashkent", "UTC+5"]),
    reveal: l("Спички из бара: подозреваемый живёт в Ташкенте, UTC+5.", "Matches from a bar: the suspect lives in Tashkent, UTC+5."),
  },
  {
    id: "ticket",
    kind: "ticket",
    at: [-2.35, 7.75],
    yaw: 9,
    print: l(["БИЛЕТ", "Ташкент → Испания", "EPAM · 1 из 8"], ["TICKET", "Tashkent → Spain", "EPAM · 1 of 8"]),
    reveal: l(
      "Билет в Испанию: стажировка EPAM, выбрали 8 студентов — он один из них.",
      "A ticket to Spain: an EPAM internship for 8 students, and he was one of them.",
    ),
  },
  {
    id: "bib",
    kind: "bib",
    at: [2.6, 0.75],
    yaw: -12,
    print: l(["МАРАФОН", "404"], ["MARATHON", "404"]),
    reveal: l("Номер марафонца. Выносливость подтверждена.", "A marathon bib. Stamina confirmed."),
  },
  {
    id: "spanish",
    kind: "note",
    at: [-6.2, 0.9],
    yaw: 14,
    print: l(["¡Hola!", "¿Qué tal?"], ["¡Hola!", "¿Qué tal?"]),
    reveal: l("Шпаргалка по испанскому: учит язык, уровень A1.", "A Spanish crib note: learning the language, level A1."),
  },
];
