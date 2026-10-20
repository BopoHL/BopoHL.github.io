import { l } from "./localize";
import type { FinaleVariant, Station } from "./types";

const investigation: Station[] = [
  {
    id: "intro",
    label: l("Подозреваемый", "Suspect"),
    focus: ["mugshot", "question"],
    subtitle: l("Дело открыто. Личность подозреваемого не установлена.", "Case opened. Suspect's identity unknown."),
  },
  {
    id: "alif",
    label: l("Alif", "Alif"),
    focus: ["alif-clip", "alif-chart", "alif-question"],
    angle: [7, 2],
    subtitle: l("Улика № 1. Финтех Alif, 2024–2025.", "Exhibit 1. Alif fintech, 2024–2025."),
  },
  {
    id: "alif-deep",
    label: l("Alif: досье", "Alif: file"),
    focus: ["alif-file", "alif-rumor", "alif-cloud"],
    angle: [9, -3],
    subtitle: l(
      "Следы ведут глубже: архитектура, интеграции, наставничество.",
      "The trail goes deeper: architecture, integrations, mentoring.",
    ),
  },
  {
    id: "dmed",
    label: l("DMed", "DMed"),
    focus: ["dmed-secret", "dmed-clip", "dmed-storage", "dmed-sticky"],
    angle: [4, -6],
    subtitle: l("Улика № 2. Государственная медсистема DMed, 2026.", "Exhibit 2. DMed, the national medical system, 2026."),
  },
  {
    id: "projects",
    label: l("Личные проекты", "Side projects"),
    focus: ["stb-photo", "stb-file", "stb-link", "github", "this-site", "file-two"],
    angle: [-5, -6],
    subtitle: l("Улика № 3. Личные проекты. Работает даже по ночам.", "Exhibit 3. Side projects. Works even at night."),
  },
  {
    id: "study",
    label: l("Учёба", "Education"),
    focus: ["itpu-id", "alif-academy", "academy-sticky", "proweb", "citymove"],
    angle: [-8, 0],
    subtitle: l("Улика № 4. Университет, курсы, первый стартап.", "Exhibit 4. University, courses, a first startup."),
  },
  {
    id: "spain",
    label: l("Испания и соревнования", "Spain and competitions"),
    focus: ["spain-clip", "codebattle", "hackathon", "olympiad", "volunteer"],
    angle: [-10, 3],
    subtitle: l(
      "Восемь студентов. Испания. Один из них — подозреваемый.",
      "Eight students. Spain. One of them is our suspect.",
    ),
  },
  {
    id: "hobby",
    label: l("Горы и марафоны", "Mountains and marathons"),
    focus: ["mountains", "mountains-sticky", "marathon", "marathon-sticky", "race-results"],
    angle: [-3, 8],
    subtitle: l("Улика № 5. Горы и марафоны. Выносливость подтверждена.", "Exhibit 5. Mountains and marathons. Stamina confirmed."),
  },
  {
    id: "overview",
    label: l("Общий план", "Overview"),
    focus: "all",
    angle: [0, 0],
    subtitle: l("Все нити ведут к одному человеку.", "Every thread leads to one man."),
  },
];

const finale: Record<FinaleVariant, Station> = {
  reveal: {
    id: "finale",
    label: l("Дело раскрыто", "Case closed"),
    focus: ["mugshot"],
    angle: [0, 0],
    reserveBottom: 0.36,
    subtitle: l("Дело раскрыто.", "Case closed."),
  },
  folder: {
    id: "finale",
    label: l("Дело раскрыто", "Case closed"),
    focus: ["case-folder"],
    angle: [4, 4],
    reserveBottom: 0.36,
    subtitle: l("Дело раскрыто.", "Case closed."),
  },
};

export const stationsFor = (variant: FinaleVariant): Station[] => [...investigation, finale[variant]];
