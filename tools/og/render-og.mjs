import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright-core";

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://localhost:3000" },
    locales: { type: "string", default: "ru,en" },
    out: { type: "string", default: "public/og" },
    chrome: { type: "string", default: process.env.CHROME_PATH },
    software: { type: "boolean", default: false },
  },
});

const SIZE = { width: 1200, height: 630 };
const SETTLE_MS = 25_000;

const softwareGl = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const browser = await chromium.launch({
  ...(values.chrome ? { executablePath: values.chrome } : { channel: "chrome" }),
  args: values.software ? softwareGl : [],
});

for (const locale of values.locales.split(",")) {
  const page = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1 });
  await page.goto(`${values.url}/${locale}/`, { waitUntil: "load" });
  await page.waitForSelector('[role="status"][aria-hidden="true"]', { timeout: 300_000 });
  const chapters = page.locator("ol button");
  await chapters.nth((await chapters.count()) - 2).click({ force: true });
  await page.waitForTimeout(SETTLE_MS);

  await page.evaluate(() => {
    const name = document.getElementById("dossier-title");
    const card = {
      label: document.title.split(" — ")[0],
      name: name?.textContent ?? "",
      role: name?.nextElementSibling?.textContent ?? "",
      tagline: document.querySelector('meta[name="description"]')?.getAttribute("content")?.split(":")[0] ?? "",
    };
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("The board did not render");
    for (const element of document.body.querySelectorAll("*")) {
      if (!element.contains(canvas) && !canvas.contains(element) && element !== canvas) element.style.visibility = "hidden";
    }
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:99;visibility:visible;display:flex;flex-direction:column;justify-content:flex-end;padding:48px 56px;" +
      "background:linear-gradient(180deg,rgba(10,8,6,0) 35%,rgba(10,8,6,0.88) 82%);color:#e8dcc0;font-family:var(--font-typewriter),monospace";
    overlay.innerHTML = `
      <div style="position:absolute;top:40px;left:56px;padding:6px 14px;border:3px solid #c0262b;color:#c0262b;font:600 26px var(--font-stamp),sans-serif;letter-spacing:.14em;text-transform:uppercase;transform:rotate(-3deg)">${card.label}</div>
      <div style="font:900 68px/1.02 var(--font-headline),serif;color:#f3ead6">${card.name}</div>
      <div style="margin-top:14px;font-size:26px">${card.role}</div>
      <div style="margin-top:8px;font-size:20px;color:#a99f8a">${card.tagline}</div>`;
    document.body.append(overlay);
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);

  const path = resolve(values.out, `case-404-${locale}.jpg`);
  mkdirSync(dirname(path), { recursive: true });
  await page.screenshot({ path, type: "jpeg", quality: 86, timeout: 240_000 });
  await page.close();
  console.log(`Saved ${path}`);
}

await browser.close();
