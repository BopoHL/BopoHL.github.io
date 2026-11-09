import { expect, test } from "@playwright/test";
import { boardLoaded, disableWebGL, loseWebGLContext, skipTitleCard } from "./case";

test.describe("for a recruiter in a hurry", () => {
  test.beforeEach(async ({ page }) => {
    await skipTitleCard(page);
  });

  test("skipping the investigation opens the dossier with the résumé", async ({ page, request }) => {
    await page.goto("/ru/");
    await boardLoaded(page);
    await page.getByRole("button", { name: "Пропустить расследование" }).click();
    const dossier = page.getByRole("dialog", { name: "Леонид Воронин" });
    await expect(dossier).toBeVisible();
    const pdf = dossier.getByRole("link", { name: "Скачать резюме" });
    await expect(pdf).toHaveAttribute("href", "/cv/leonid-voronin-cv-ru.pdf");
    const file = await request.get("/cv/leonid-voronin-cv-ru.pdf");
    expect(file.ok()).toBe(true);
    expect(file.headers()["content-type"]).toContain("pdf");
    await expect(dossier.getByRole("link", { name: "vlo99@yandex.ru" })).toHaveAttribute("href", "mailto:vlo99@yandex.ru");
  });

  test("the English version has its own résumé and metadata", async ({ page, request }) => {
    await page.goto("/en/");
    await expect(page).toHaveTitle(/Case № 404/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /case-404-en\.jpg$/);
    await expect(page.locator('link[rel="alternate"][hreflang="ru"]')).toHaveCount(1);
    const person = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
    expect(person["@type"]).toBe("Person");
    expect((await request.get("/cv/leonid-voronin-cv-en.pdf")).ok()).toBe(true);
  });

  test("switching the language keeps the visitor on the case", async ({ page }) => {
    await page.goto("/ru/");
    await boardLoaded(page);
    await page.getByRole("link", { name: "EN", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/?$/);
    await expect(page.getByRole("button", { name: "Skip the investigation" })).toBeVisible();
  });
});

test.describe("when the 3D board cannot run", () => {
  test("the dossier opens straight away without WebGL", async ({ page }) => {
    await disableWebGL(page);
    await page.goto("/ru/");
    const dossier = page.getByRole("dialog", { name: "Леонид Воронин" });
    await expect(dossier).toBeVisible();
    await expect(dossier.getByText("3D-доска не запускается")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("a lost GPU context falls back to the dossier", async ({ page }) => {
    await skipTitleCard(page);
    await page.goto("/ru/");
    await boardLoaded(page);
    expect(await loseWebGLContext(page)).toBe(true);
    await expect(page.getByRole("dialog", { name: "Леонид Воронин" })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("canvas")).toHaveCount(0);
  });
});

test.describe("the investigation", () => {
  test("the title card shows once and any key skips it", async ({ page }) => {
    await page.goto("/ru/");
    const hint = page.getByText("Любая клавиша или касание — пропустить");
    await expect(hint).toBeVisible({ timeout: 300_000 });
    await page.keyboard.press("Space");
    await boardLoaded(page);
    await page.reload();
    await boardLoaded(page);
    await expect(hint).toHaveCount(0);
  });

  test("the last chapter solves the case and lets the visitor look around", async ({ page }) => {
    await skipTitleCard(page);
    await page.goto("/ru/");
    await boardLoaded(page);
    await page.locator("ol button").last().click({ force: true });
    const finale = page.getByRole("heading", { name: "Леонид Воронин", level: 2 });
    await expect(finale).toBeVisible({ timeout: 120_000 });
    const card = page.locator("section", { has: finale });
    await expect(card.getByRole("button", { name: "Осмотреть доску" })).toBeVisible();
    await expect(card.getByRole("link", { name: "Скачать резюме" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Связаться" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Досье" })).toHaveCount(0);

    await page.getByRole("button", { name: "Осмотреть доску" }).click();
    await expect(page.getByText(/Тайные улики: \d\/4/)).toBeVisible();
    await expect(page.getByRole("button", { name: "К столу" })).toHaveCount(0);

    const caseIndex = page.getByRole("navigation", { name: "Дела на доске" });
    await caseIndex.getByRole("button").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#case-file-title")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#case-file-title")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(finale).toBeVisible();
  });
});
