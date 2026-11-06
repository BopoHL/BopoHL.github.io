import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright-core";

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://localhost:3000" },
    locale: { type: "string" },
    out: { type: "string" },
    chrome: { type: "string", default: process.env.CHROME_PATH },
  },
});

const locales = values.locale ? [values.locale] : ["ru", "en"];
const browser = await chromium.launch(values.chrome ? { executablePath: values.chrome } : { channel: "chrome" });
const page = await browser.newPage();
for (const locale of locales) {
  const out = resolve(values.out && locales.length === 1 ? values.out : `public/cv/leonid-voronin-cv-${locale}.pdf`);
  await page.goto(`${values.url}/${locale}/resume/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out, format: "A4", preferCSSPageSize: true });
  console.log(`Printed the résumé to ${out}`);
}
await browser.close();
