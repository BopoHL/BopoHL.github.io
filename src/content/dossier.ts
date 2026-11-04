import { l } from "./localize";
import type { Localized } from "./types";

export interface DossierEntry {
  title: Localized;
  place: Localized;
  period: Localized;
  points: Localized<string[]>;
}

export interface DossierSection {
  id: string;
  title: Localized;
  entries: DossierEntry[];
}

export const dossierSummary = l(
  "Backend-разработчик на PHP/Laravel, 2,5 года в финтехе и медтехе. Декомпозирую сложные системы в масштабируемую архитектуру с фокусом на производительности кода и стоимости его работы в облаке. Активно использую AI-инструменты в работе.",
  "Backend developer working in PHP/Laravel, with 2.5 years in fintech and medtech. I break complex systems down into scalable architecture, with a focus on code performance and its cost to run in the cloud. I use AI tools heavily in daily work.",
);

export const dossierSections: DossierSection[] = [
  {
    id: "experience",
    title: l("Опыт", "Experience"),
    entries: [
      {
        title: l("Backend-разработчик", "Backend developer"),
        place: l("DMed — единая государственная медицинская система", "DMed — Uzbekistan's unified state medical system"),
        period: l("Февраль 2026 — август 2026", "February 2026 — August 2026"),
        points: l(
          [
            "Работал над высоконагруженной системой с аудиторией более 10 млн пользователей.",
            "Проектировал и писал высоконагруженные оптимизированные запросы PostgreSQL.",
            "Разрабатывал интеграции со службами МВД и прокуратуры.",
            "Оптимизировал хранение файлов в базе данных и SeaweedFS, сократив затраты на серверные хранилища.",
            "Работал в сжатые сроки при высоких государственных требованиях к системе.",
          ],
          [
            "Worked on a high-load system serving more than 10 million users.",
            "Designed and wrote optimized high-load PostgreSQL queries.",
            "Built integrations with the Interior Ministry and the Prosecutor's Office.",
            "Optimized file storage in the database and SeaweedFS, cutting server storage costs.",
            "Delivered on tight deadlines under strict government requirements.",
          ],
        ),
      },
      {
        title: l("Backend-разработчик", "Backend developer"),
        place: l("Alif Uzbekistan, финтех", "Alif Uzbekistan, fintech"),
        period: l("Апрель 2024 — ноябрь 2025", "April 2024 — November 2025"),
        points: l(
          [
            "Сократил задержку API в 5 раз (с 1000 до ~200 мс) за счёт оптимизации SQL-запросов и рефакторинга.",
            "Объединил 2 клиентские экосистемы в одну, внедрив Unified Identity и решив проблему консистентности данных.",
            "Улучшил флоу онбординга клиентов и партнёров, интегрировал MyID.",
            "Проектировал модули по DDD, работал с CQRS.",
            "Снизил расходы на облако: аудит ресурсов и хранилищ в Kubernetes, сжатие данных.",
            "Разработал алгоритм автоматической оценки клиентов для compliance-команды.",
            "Спроектировал универсальную схему интеграции, которую используют для всех новых партнёров.",
            "Наставлял двух junior-разработчиков.",
          ],
          [
            "Cut API latency fivefold (from 1000 to ~200 ms) through SQL optimization and refactoring.",
            "Merged 2 client ecosystems into one by introducing Unified Identity and solving data consistency.",
            "Improved client and partner onboarding, integrated MyID.",
            "Designed modules with DDD, worked with CQRS.",
            "Lowered cloud costs: Kubernetes resource and storage audit, data compression.",
            "Built an automated client scoring algorithm for the compliance team.",
            "Designed a universal integration scheme used for every new partner.",
            "Mentored two junior developers.",
          ],
        ),
      },
    ],
  },
  {
    id: "education",
    title: l("Образование", "Education"),
    entries: [
      {
        title: l("Бакалавр, программная инженерия", "BSc, Software Engineering"),
        place: l("IT Park University, филиал школы инженерии EPAM", "IT Park University, EPAM School of Engineering branch"),
        period: l("2023 — 2026", "2023 — 2026"),
        points: l(
          ["Алгоритмы и структуры данных, криптография, backend и frontend, QA, анализ данных."],
          ["Algorithms and data structures, cryptography, backend and frontend, QA, data analysis."],
        ),
      },
      {
        title: l("Back-End разработка", "Back-End development"),
        place: l("Alif Academy", "Alif Academy"),
        period: l("2023 — 2024", "2023 — 2024"),
        points: l(
          ["PHP, SQL и Redis, два приложения на Laravel, настройка окружения веб-сервера."],
          ["PHP, SQL and Redis, two Laravel applications, web server environment setup."],
        ),
      },
      {
        title: l("Мобильная разработка", "Mobile development"),
        place: l("PROWEB", "PROWEB"),
        period: l("2023", "2023"),
        points: l(["Шесть пет-проектов на Flutter."], ["Six pet projects in Flutter."]),
      },
    ],
  },
  {
    id: "awards",
    title: l("Соревнования и волонтёрство", "Competitions and volunteering"),
    entries: [
      {
        title: l("Стажировка EPAM в Испании", "EPAM internship in Spain"),
        place: l("ITPU | EPAM", "ITPU | EPAM"),
        period: l("2024", "2024"),
        points: l(
          ["Один из 8 студентов, получивших полностью оплачиваемую стажировку и визит в офисы EPAM."],
          ["One of 8 students awarded a fully paid internship and a visit to EPAM's offices."],
        ),
      },
      {
        title: l("Победитель CodeBattle", "CodeBattle winner"),
        place: l("ITPU | EHU Lithuania", "ITPU | EHU Lithuania"),
        period: l("2023", "2023"),
        points: l(["Международное соревнование по программированию."], ["International programming competition."]),
      },
      {
        title: l("AI-хакатон", "AI hackathon"),
        place: l("New Uzbekistan University", "New Uzbekistan University"),
        period: l("2024", "2024"),
        points: l(["Обучающее приложение на Unity с применением ИИ."], ["An AI-powered learning app built in Unity."]),
      },
      {
        title: l("Олимпиада по спортивному программированию", "Competitive programming olympiad"),
        place: l("ITPU", "ITPU"),
        period: l("2024", "2024"),
        points: l([], []),
      },
      {
        title: l("Мобильный разработчик в стартапе CityMove", "Mobile developer at CityMove startup"),
        place: l("Победитель Pizza&Pitch", "Pizza&Pitch winner"),
        period: l("2023", "2023"),
        points: l(["Frontend мобильного приложения на Flutter."], ["Frontend of the Flutter mobile app."]),
      },
      {
        title: l("Волонтёр", "Volunteer"),
        place: l("ICTWeek Uzbekistan, EPAM E-kids", "ICTWeek Uzbekistan, EPAM E-kids"),
        period: l("2023", "2023"),
        points: l([], []),
      },
    ],
  },
];

export const dossierSkills = l(
  [
    "PHP, Laravel, PostgreSQL, MySQL",
    "Docker, Kubernetes, Redis, Kafka, ElasticSearch",
    "DDD, CQRS, микросервисы, SOLID",
    "Grafana, Prometheus, Sentry",
    "React, Next.js — в личных проектах",
  ],
  [
    "PHP, Laravel, PostgreSQL, MySQL",
    "Docker, Kubernetes, Redis, Kafka, ElasticSearch",
    "DDD, CQRS, microservices, SOLID",
    "Grafana, Prometheus, Sentry",
    "React, Next.js — in side projects",
  ],
);

export const dossierLanguages = l(
  ["Русский — родной", "Английский — C1", "Испанский — A1"],
  ["Russian — native", "English — C1", "Spanish — A1"],
);
