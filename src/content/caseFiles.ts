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
        "Telegram Mini App: делит общий счёт в ресторане прямо в Telegram.",
        "API на FastAPI и PostgreSQL, фронтенд на Next.js, Tailwind и Zustand.",
        "Вход через Telegram, оплаты видны в реальном времени, интерфейс на английском, русском и узбекском.",
        "Продуктовые воронки в PostHog; Docker, свой VPS, nginx, CI/CD.",
      ],
      [
        "A Telegram Mini App that splits a restaurant bill right inside Telegram.",
        "A FastAPI and PostgreSQL API with a Next.js, Tailwind and Zustand frontend.",
        "Telegram sign-in, payments tracked live, English, Russian and Uzbek.",
        "Product funnels in PostHog; Docker, own VPS, nginx, CI/CD.",
      ],
    ),
    figure: {
      kind: "flow",
      caption: l("Путь запроса", "Request path"),
      nodes: [
        { id: "telegram", label: l("Telegram", "Telegram"), at: [0, 0] },
        { id: "app", label: l("Next.js", "Next.js"), at: [1, 0] },
        { id: "api", label: l("FastAPI", "FastAPI"), at: [2, 0], accent: true },
        { id: "postgres", label: l("PostgreSQL", "PostgreSQL"), at: [2, 1] },
      ],
      links: [
        ["telegram", "app"],
        ["app", "api"],
        ["api", "postgres"],
      ],
    },
    stack: ["Python", "FastAPI", "PostgreSQL", "Next.js", "Tailwind", "Zustand", "Docker", "nginx"],
    link: { label: l("Открыть приложение", "Open the app"), href: "https://t.me/splitt_app" },
  },
  {
    id: "tg-serp",
    evidence: ["tg-serp"],
    title: l("TG SERP", "TG SERP"),
    period: l("Личный проект, в проде", "Side project, in production"),
    findings: l(
      [
        "Превращает посты публичных Telegram-каналов в страницы, которые находят Google, Яндекс и AI-поиск.",
        "Модульный монолит на NestJS; воркеры на Redis и BullMQ обрабатывают обновления идемпотентно.",
        "PostgreSQL, файлы в S3 за CDN; модерация и SEO-метаданные через OpenAI.",
        "Next.js с серверным рендерингом, JSON-LD и sitemap; оплата через Click и Payme.",
      ],
      [
        "Turns posts from public Telegram channels into pages that Google, Yandex and AI search can find.",
        "A NestJS modular monolith; Redis and BullMQ workers process updates idempotently.",
        "PostgreSQL, files in S3 behind a CDN; moderation and SEO metadata through OpenAI.",
        "Server-rendered Next.js with JSON-LD and sitemaps; billing through Click and Payme.",
      ],
    ),
    figure: {
      kind: "flow",
      caption: l("Путь поста", "A post's path"),
      nodes: [
        { id: "channel", label: l("Telegram-канал", "Telegram channel"), at: [0, 0] },
        { id: "workers", label: l("NestJS · BullMQ", "NestJS · BullMQ"), at: [1, 0], accent: true },
        { id: "openai", label: l("OpenAI", "OpenAI"), at: [2, 0] },
        { id: "store", label: l("PostgreSQL · S3", "PostgreSQL · S3"), at: [1, 1] },
        { id: "site", label: l("Next.js SSR", "Next.js SSR"), at: [2, 1] },
      ],
      links: [
        ["channel", "workers"],
        ["workers", "openai"],
        ["workers", "store"],
        ["store", "site"],
      ],
    },
    stack: ["TypeScript", "NestJS", "Redis", "BullMQ", "PostgreSQL", "S3", "OpenAI", "Next.js"],
    link: { label: l("Открыть сайт", "Open the site"), href: "https://tg-serp.uz/authors" },
  },
  {
    id: "bots",
    evidence: ["bots", "username-checker"],
    title: l("Платформа Telegram-ботов", "Telegram bot platform"),
    period: l("Личный проект", "Side project"),
    findings: l(
      [
        "170+ ботов проверяют спрос на идеи: отвечают на /start и ведут в рабочие продукты.",
        "Принимает вебхуки многих ботов, отбрасывает повторы по update_id и считает источники трафика.",
        "MCP-сервер: ботов заводят и настраивают AI-агенты.",
        "Username Checker на MTProto с оплатой в Telegram Stars.",
      ],
      [
        "170+ bots test demand for ideas: they answer /start and route people to working products.",
        "Ingests webhooks from many bots, drops repeats by update_id and attributes traffic sources.",
        "An MCP server lets AI agents create and configure the bots.",
        "A username checker on MTProto with Telegram Stars payments.",
      ],
    ),
    stack: ["Telegram Bot API", "MTProto", "MCP", "Telegram Stars"],
    link: { label: l("Проверить ник", "Check a username"), href: "https://t.me/CheckTelegramUsername_Bot" },
  },
];

export const caseFileFor = (evidenceId: string | null) =>
  evidenceId ? caseFiles.find((file) => file.evidence.includes(evidenceId)) : undefined;
