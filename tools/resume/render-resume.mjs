import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright-core";

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://localhost:3000" },
    locale: { type: "string", default: "en" },
    out: { type: "string" },
    chrome: { type: "string", default: process.env.CHROME_PATH },
  },
});

const out = resolve(values.out ?? `public/cv/leonid-voronin-cv-${values.locale}.pdf`);
const browser = await chromium.launch(values.chrome ? { executablePath: values.chrome } : { channel: "chrome" });
const page = await browser.newPage();
await page.goto(`${values.url}/${values.locale}/resume/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: out, format: "A4", preferCSSPageSize: true });
await browser.close();

console.log(`Printed the résumé to ${out}`);
