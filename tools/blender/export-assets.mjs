import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright-core";

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://localhost:3000" },
    locale: { type: "string", default: "ru" },
    finale: { type: "string", default: "a" },
    out: { type: "string", default: "tools/blender/out" },
    chrome: { type: "string", default: process.env.CHROME_PATH },
  },
});

const outDir = resolve(values.out);
const texturesDir = join(outDir, "textures");
mkdirSync(texturesDir, { recursive: true });

const browser = await chromium.launch(values.chrome ? { executablePath: values.chrome } : { channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.goto(`${values.url}/${values.locale}/evidence-sheet/?finale=${values.finale}`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-status^="ready"]', { timeout: 180_000 });

const textures = await page.$$eval("figure[data-evidence]", (figures) =>
  figures.map((figure) => ({
    id: figure.dataset.evidence,
    data: figure.querySelector("canvas").toDataURL("image/png"),
  })),
);
for (const { id, data } of textures) {
  writeFileSync(join(texturesDir, `${id}.png`), Buffer.from(data.split(",")[1], "base64"));
}

const scene = await page.evaluate(() => window.__caseScene);
writeFileSync(join(outDir, "scene.json"), JSON.stringify(scene, null, 2));
await browser.close();

console.log(`Exported ${textures.length} textures and scene.json to ${outDir}`);
