import { l } from "./localize";
import type { Localized } from "./types";

export interface FlowNode {
  id: string;
  label: Localized;
  at: [column: number, row: number];
  accent?: boolean;
}

export type CaseFigure =
  | {
      kind: "before-after";
      caption: Localized;
      unit: Localized;
      before: number;
      after: number;
    }
  | {
      kind: "flow";
      caption: Localized;
      nodes: FlowNode[];
      links: Array<[from: string, to: string]>;
    };

export interface CaseFile {
  id: string;
  evidence: string[];
  title: Localized;
  period: Localized;
  findings: Localized<string[]>;
  figure?: CaseFigure;
  stack: string[];
  link?: { label: Localized; href: string };
}

export const caseFiles: CaseFile[] = [
  {
    id: "alif-latency",
    evidence: ["alif-clip", "alif-chart", "alif-question"],
    title: l("Alif: задержка API", "Alif: API latency"),
    period: l("Апрель 2024 — ноябрь 2025", "April 2024 — November 2025"),
    findings: l(
      [
        "Задержка API сократилась в 5 раз: с 1000 до ~200 мс.",
        "Способ: оптимизация SQL-запросов и рефакторинг кода.",
      ],
      ["API latency dropped fivefold, from 1000 to ~200 ms.", "Method: SQL query optimization and refactoring."],
    ),
    figure: {
      kind: "before-after",
      caption: l("Задержка API", "API latency"),
      unit: l("мс", "ms"),
      before: 1000,
      after: 200,
    },
    stack: ["PHP", "Laravel", "SQL"],
  },
  {
    id: "alif-architecture",
    evidence: ["alif-file", "alif-rumor"],
    title: l("Alif: архитектура и интеграции", "Alif: architecture and integrations"),
    period: l("Апрель 2024 — ноябрь 2025", "April 2024 — November 2025"),
    findings: l(
      [
        "Объединил 2 клиентские экосистемы в одну через Unified Identity и решил проблему консистентности данных.",
        "Улучшил онбординг клиентов и партнёров, интегрировал MyID.",
        "Проектировал модули по DDD, работал с CQRS.",
        "Спроектировал универсальную схему интеграции для всех новых партнёров.",
        "Разработал алгоритм автоматической оценки клиентов для compliance-команды.",
        "Наставлял двух junior-разработчиков.",
      ],
      [
        "Merged 2 client ecosystems into one with Unified Identity and solved data consistency.",
        "Improved client and partner onboarding, integrated MyID.",
        "Designed modules with DDD, worked with CQRS.",
        "Designed a universal integration scheme used for every new partner.",
        "Built an automated client scoring algorithm for the compliance team.",
        "Mentored two junior developers.",
      ],
    ),
    figure: {
      kind: "flow",
      caption: l("Две экосистемы — один клиент", "Two ecosystems, one client"),
      nodes: [
        { id: "first", label: l("Экосистема 1", "Ecosystem 1"), at: [0, 0] },
        { id: "second", label: l("Экосистема 2", "Ecosystem 2"), at: [0, 1] },
        { id: "identity", label: l("Unified Identity", "Unified Identity"), at: [1, 0.5], accent: true },
        { id: "client", label: l("Единые данные", "Consistent data"), at: [2, 0.5] },
        { id: "myid", label: l("MyID", "MyID"), at: [0, 2] },
        { id: "onboarding", label: l("Онбординг", "Onboarding"), at: [1, 2] },
      ],
      links: [
        ["first", "identity"],
        ["second", "identity"],
        ["identity", "client"],
        ["myid", "onboarding"],
      ],
    },
    stack: ["PHP", "Laravel", "DDD", "CQRS", "MyID"],
  },
  {
    id: "alif-cloud",
    evidence: ["alif-cloud"],
    title: l("Alif: расходы на облако", "Alif: cloud costs"),
    period: l("Апрель 2024 — ноябрь 2025", "April 2024 — November 2025"),
    findings: l(
      ["Провёл аудит ресурсов и хранилищ в Kubernetes.", "Сжал данные.", "Итог: расходы на облако снизились."],
      ["Audited resources and storage in Kubernetes.", "Compressed data.", "Result: lower cloud costs."],
    ),
    stack: ["Kubernetes"],
  },
  {
    id: "dmed",
    evidence: ["dmed-secret", "dmed-clip", "dmed-storage", "dmed-sticky"],
    title: l("DMed: единая медицинская система", "DMed: the unified medical system"),
    period: l("Февраль 2026 — август 2026", "February 2026 — August 2026"),
    findings: l(
      [
        "Высоконагруженная система: более 10 млн пользователей.",
        "Проектировал и писал оптимизированные запросы PostgreSQL.",
        "Разработал интеграции со службами МВД и прокуратуры.",
        "Оптимизировал хранение файлов в базе данных и SeaweedFS, сократив затраты на хранилища.",
        "Сжатые сроки и высокие государственные требования.",
      ],
      [
        "A high-load system with more than 10 million users.",
        "Designed and wrote optimized PostgreSQL queries.",
        "Built integrations with the Interior Ministry and the Prosecutor's Office.",
        "Optimized file storage across the database and SeaweedFS, cutting storage costs.",
        "Tight deadlines and strict government requirements.",
      ],
    ),
    figure: {
      kind: "flow",
      caption: l("Что связано с DMed", "What DMed is wired to"),
      nodes: [
        { id: "police", label: l("МВД", "Interior Ministry"), at: [0, 0] },
        { id: "prosecutors", label: l("Прокуратура", "Prosecutors"), at: [0, 1] },
        { id: "dmed", label: l("DMed · 10M+", "DMed · 10M+"), at: [1, 0.5], accent: true },
        { id: "postgres", label: l("PostgreSQL", "PostgreSQL"), at: [2, 0] },
        { id: "seaweed", label: l("SeaweedFS", "SeaweedFS"), at: [2, 1] },
      ],
      links: [
        ["police", "dmed"],
        ["prosecutors", "dmed"],
        ["dmed", "postgres"],
        ["dmed", "seaweed"],
      ],
    },
    stack: ["PHP", "Laravel", "PostgreSQL", "SeaweedFS"],
  },
  {
    id: "split-the-bill",
    evidence: ["stb-file", "stb-photo", "stb-link"],
    title: l("Split the Bill", "Split the Bill"),
    period: l("Личный проект, в проде", "Side project, in production"),
    findings: l(
      [
        "Telegram Mini App: делит общий счёт прямо в Telegram.",
        "Backend: Laravel Octane + FrankenPHP.",
        "Frontend: React + TypeScript.",
        "Инфраструктура: Docker, свой VPS, nginx, CI/CD.",
      ],
      [
        "A Telegram Mini App that splits a shared bill right inside Telegram.",
        "Backend: Laravel Octane + FrankenPHP.",
        "Frontend: React + TypeScript.",
        "Infrastructure: Docker, own VPS, nginx, CI/CD.",
      ],
    ),
    figure: {
      kind: "flow",
      caption: l("Путь запроса", "Request path"),
      nodes: [
        { id: "telegram", label: l("Telegram", "Telegram"), at: [0, 0] },
        { id: "app", label: l("React + TS", "React + TS"), at: [1, 0] },
        { id: "nginx", label: l("nginx", "nginx"), at: [1, 1] },
        { id: "api", label: l("Octane · FrankenPHP", "Octane · FrankenPHP"), at: [2, 1], accent: true },
      ],
      links: [
        ["telegram", "app"],
        ["app", "nginx"],
        ["nginx", "api"],
      ],
    },
    stack: ["Laravel Octane", "FrankenPHP", "React", "TypeScript", "Docker", "nginx"],
    link: { label: l("Открыть бота", "Open the bot"), href: "https://t.me/split_the_bills_bot" },
  },
];

export const caseFileFor = (evidenceId: string | null) =>
  evidenceId ? caseFiles.find((file) => file.evidence.includes(evidenceId)) : undefined;
