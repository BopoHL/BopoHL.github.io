import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright-core";

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://localhost:3000" },
    out: { type: "string", default: "public/audio/case-404.mp3" },
    bitrate: { type: "string", default: "56k" },
    chrome: { type: "string", default: process.env.CHROME_PATH },
  },
});

const workDir = mkdtempSync(join(tmpdir(), "tape-"));
const wav = join(workDir, "noir-jazz.wav");
const out = resolve(values.out);

try {
  const browser = await chromium.launch(values.chrome ? { executablePath: values.chrome } : { channel: "chrome" });
  const page = await browser.newPage();
  await page.goto(`${values.url}/en/tape-studio/`, { waitUntil: "load" });
  await page.waitForSelector('[data-status^="ready"]', { timeout: 300_000 });
  const [download] = await Promise.all([page.waitForEvent("download"), page.click("[data-recording]")]);
  await download.saveAs(wav);
  await browser.close();

  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-codec:a", "libmp3lame", "-b:a", values.bitrate, out], {
    stdio: "inherit",
  });
  console.log(`Recorded the tape to ${out}`);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
