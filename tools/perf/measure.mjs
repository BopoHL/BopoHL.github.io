import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { chromium } from "playwright-core";

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://localhost:3000" },
    locale: { type: "string", default: "ru" },
    width: { type: "string", default: "1440" },
    height: { type: "string", default: "900" },
    seconds: { type: "string", default: "6" },
    out: { type: "string" },
    chrome: { type: "string", default: process.env.CHROME_PATH },
    software: { type: "boolean", default: false },
  },
});

const viewport = { width: Number(values.width), height: Number(values.height) };
const seconds = Number(values.seconds);
const softwareGl = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

const instrument = () => {
  window.localStorage.setItem("case404:sound", "off");
  window.sessionStorage.setItem("case404:title-seen", "1");

  const seen = { scenes: [], renderers: [] };
  window.__perf = { seen, draws: 0, triangles: 0, ticks: 0, frames: [] };
  window.__THREE_DEVTOOLS__ = new EventTarget();
  window.__THREE_DEVTOOLS__.addEventListener("observe", ({ detail }) => {
    if (detail.isScene) seen.scenes.push(detail);
    if (detail.isWebGLRenderer) seen.renderers.push(detail);
  });

  const perf = window.__perf;
  const proto = WebGL2RenderingContext.prototype;
  const calls = {
    drawArrays: (args) => [args[0], args[2], 1],
    drawElements: (args) => [args[0], args[1], 1],
    drawArraysInstanced: (args) => [args[0], args[2], args[3]],
    drawElementsInstanced: (args) => [args[0], args[1], args[4]],
  };
  for (const [name, read] of Object.entries(calls)) {
    const original = proto[name];
    proto[name] = function (...args) {
      const [mode, count, instances] = read(args);
      perf.draws++;
      if (mode === this.TRIANGLES) perf.triangles += (count / 3) * instances;
      return original.apply(this, args);
    };
  }

  let last = { draws: 0, triangles: 0 };
  const tick = () => {
    perf.ticks++;
    if (perf.draws !== last.draws) perf.frames.push([performance.now(), perf.draws - last.draws, perf.triangles - last.triangles]);
    last = { draws: perf.draws, triangles: perf.triangles };
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const sceneStats = () => {
  const { scenes, renderers } = window.__perf.seen;
  const size = (scene) => {
    let nodes = 0;
    scene.traverse(() => nodes++);
    return nodes;
  };
  const scene = scenes.reduce((largest, candidate) => (size(candidate) > size(largest) ? candidate : largest));
  const triangles = (mesh) =>
    ((mesh.geometry.index ? mesh.geometry.index.count : mesh.geometry.attributes.position.count) / 3) *
    (mesh.isInstancedMesh ? mesh.count : 1);
  const stats = { meshes: 0, casters: 0, triangles: 0, shadowMaps: [] };
  scene.traverse((object) => {
    if (object.isLight && object.castShadow) stats.shadowMaps.push(object.shadow.mapSize.x);
    if (!object.isMesh) return;
    stats.meshes++;
    stats.triangles += triangles(object);
    if (object.castShadow) stats.casters++;
  });
  const renderer = renderers[0];
  return { ...stats, ...renderer.info.memory, programs: renderer.info.programs.length, pixelRatio: renderer.getPixelRatio() };
};

const browser = await chromium.launch({
  ...(values.chrome ? { executablePath: values.chrome } : { channel: "chrome" }),
  args: values.software ? softwareGl : [],
});
const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
await page.addInitScript(instrument);
const cdp = await page.context().newCDPSession(page);
await cdp.send("Performance.enable");
const busy = async () => {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(metrics.map(({ name, value }) => [name, value]));
};

const report = { url: values.url, viewport, states: {} };
const measure = async (state) => {
  const before = await busy();
  await page.evaluate(() => Object.assign(window.__perf, { ticks: 0, frames: [] }));
  await page.waitForTimeout(seconds * 1000);
  const { ticks, frames } = await page.evaluate(() => ({ ticks: window.__perf.ticks, frames: window.__perf.frames.slice(1) }));
  const after = await busy();
  const median = (column) => {
    const sorted = frames.map((frame) => frame[column]).sort((a, b) => a - b);
    return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  };
  report.states[state] = {
    displayFps: +(ticks / seconds).toFixed(1),
    renderedFps: +(frames.length / seconds).toFixed(1),
    drawsPerFrame: median(1),
    trianglesPerFrame: Math.round(median(2)),
    mainThreadBusy: +((after.TaskDuration - before.TaskDuration) / seconds).toFixed(2),
  };
  console.log(state.padEnd(10), JSON.stringify(report.states[state]));
};

await page.goto(`${values.url}/${values.locale}/`, { waitUntil: "load" });
await page.waitForSelector('[role="status"][aria-hidden="true"]', { state: "attached", timeout: 600_000 });
await page.waitForTimeout(3000);
report.scene = await page.evaluate(sceneStats);
console.log("scene     ", JSON.stringify(report.scene));

const chapters = page.locator("ol button");
await measure("intro");
await chapters.nth(2).click({ force: true });
await page.waitForTimeout(12_000);
await measure("station");
await chapters.nth((await chapters.count()) - 2).click({ force: true });
await page.waitForTimeout(14_000);
await measure("overview");
await chapters.last().click({ force: true });
await page.getByRole("heading", { level: 2 }).first().waitFor({ state: "visible", timeout: 120_000 });
await page.getByRole("button", { name: /^(Осмотреть доску|Explore the board)$/ }).click();
await page.mouse.move(viewport.width * 0.6, viewport.height * 0.45, { steps: 5 });
await page.mouse.wheel(0, -900);
await page.waitForTimeout(8000);
await measure("closeup");
await page.mouse.move(viewport.width * 0.5, viewport.height * 0.98, { steps: 5 });
await page.waitForTimeout(8000);
await measure("desk");

if (values.out) writeFileSync(values.out, `${JSON.stringify(report, null, 2)}\n`);
await browser.close();
