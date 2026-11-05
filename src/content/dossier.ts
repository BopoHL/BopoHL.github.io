import { l } from "./localize";
import type { Localized } from "./types";

export interface DossierEntry {
  title: Localized;
  place: Localized;
  period?: Localized;
  points: Localized<string[]>;
}

export interface DossierSection {
  id: string;
  title: Localized;
  entries: DossierEntry[];
}

export const dossierSummary = l(
  "Backend-разработчик на PHP/Laravel, 2,5 года в финтехе и медтехе, бакалавр программной инженерии (IT Park University, школа EPAM, 2026). Декомпозирую сложные системы в масштабируемую архитектуру с фокусом на производительности кода и стоимости его работы в облаке. Активно использую AI-инструменты в работе.",
  "Backend developer working in PHP/Laravel, with 2.5 years in fintech and medtech and a BSc in Software Engineering (IT Park University, EPAM school, 2026). I break complex systems down into scalable architecture, with a focus on code performance and its cost to run in the cloud. I use AI tools heavily in daily work.",
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
          [
            "Диплом бакалавра, июнь 2026; в программе EPAM — специализация Front-End.",
            "Стипендия за успеваемость от Дирекции IT Park за 6-й семестр.",
            "Академический директор в рекомендации: «один из самых перспективных студентов своего потока».",
            "Алгоритмы и структуры данных, криптография, backend и frontend, QA, анализ данных.",
          ],
          [
            "Bachelor's degree, June 2026; Front-End specialization in the EPAM program.",
            "Merit-based scholarship from the IT Park Directorate for the 6th semester.",
            "The academic director's reference: “one of the most promising students in his cohort.”",
            "Algorithms and data structures, cryptography, backend and frontend, QA, data analysis.",
          ],
        ),
      },
      {
        title: l("Backend Engineering in PHP", "Backend Engineering in PHP"),
        place: l("Alif Academy", "Alif Academy"),
        period: l("2023 — 2024", "2023 — 2024"),
        points: l(
          ["PHP, SQL и Redis, два приложения на Laravel, настройка окружения веб-сервера."],
          ["PHP, SQL and Redis, two Laravel applications, web server environment setup."],
        ),
      },
      {
        title: l("Android и iOS на Flutter", "Android and iOS with Flutter"),
        place: l("PROWEB", "PROWEB"),
        period: l("2023", "2023"),
        points: l(["8 месяцев, 64 занятия, шесть пет-проектов на Flutter."], ["8 months, 64 lessons, six pet projects in Flutter."]),
      },
      {
        title: l("Blockchain Engineering", "Blockchain Engineering"),
        place: l("Web3 Academy — Armenian Code Academy × Asterium", "Web3 Academy — Armenian Code Academy × Asterium"),
        points: l([], []),
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
        points: l(
          ["Обучающее приложение на Unity с применением ИИ.", "Приз участника — сертификат на 3 млн сум на курсы Tehnikum."],
          ["An AI-powered learning app built in Unity.", "Participant prize: a 3M sum voucher for Tehnikum courses."],
        ),
      },
      {
        title: l("Techstars Startup Weekend", "Techstars Startup Weekend"),
        place: l("Ташкент", "Tashkent"),
        period: l("2026", "2026"),
        points: l(
          ["54-часовой ideathon: от идеи к продукту, Business Model Canvas, проверка гипотез на клиентах."],
          ["A 54-hour ideathon: from idea to product, the Business Model Canvas, customer validation."],
        ),
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
        place: l("ICTWeek Uzbekistan, EPAM e-Kids", "ICTWeek Uzbekistan, EPAM e-Kids"),
        period: l("2023 — 2024", "2023 — 2024"),
        points: l(
          ["ICTWeek: стенд ITPU.", "EPAM e-Kids: ментор, учил детей программированию на Scratch."],
          ["ICTWeek: the ITPU booth.", "EPAM e-Kids: mentor teaching children to code in Scratch."],
        ),
      },
    ],
  },
  {
    id: "outside",
    title: l("Вне работы", "Outside work"),
    entries: [
      {
        title: l("Бег и горы", "Running and mountains"),
        place: l("Узбекистан", "Uzbekistan"),
        points: l(
          [
            "Bukhara Night Race: полумарафон 21,1 км (2025) и 10 км (2026).",
            "Zaamin Ultra 2025: 5 км.",
            "По выходным — горы.",
          ],
          [
            "Bukhara Night Race: a 21.1 km half marathon (2025) and 10 km (2026).",
            "Zaamin Ultra 2025: 5 km.",
            "Mountains on weekends.",
          ],
        ),
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
