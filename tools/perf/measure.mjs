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
    uncapped: { type: "boolean", default: false },
    headed: { type: "boolean", default: false },
  },
});

const viewport = { width: Number(values.width), height: Number(values.height) };
const seconds = Number(values.seconds);
const softwareGl = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const noVsync = ["--disable-gpu-vsync", "--disable-frame-rate-limit"];

const instrument = (uncapped) => {
  window.localStorage.setItem("case404:sound", "off");
  window.sessionStorage.setItem("case404:title-seen", "1");

  const seen = { scenes: [], renderers: [] };
  const wall = performance.now.bind(performance);
  window.__perf = { seen, wall, draws: 0, triangles: 0, ticks: 0, frames: [], longTasks: [] };
  new PerformanceObserver((list) => window.__perf.longTasks.push(...list.getEntries().map((entry) => entry.duration))).observe({
    type: "longtask",
    buffered: true,
  });
  if (uncapped) {
    // The page lives on a clock that gains one 60 Hz frame per real frame, so the pacer asks for
    // every frame and the governor sees a calm device; the real time between frames is their cost.
    const raf = window.requestAnimationFrame.bind(window);
    let virtual = wall();
    performance.now = () => virtual;
    window.requestAnimationFrame = (callback) => raf(() => callback(virtual));
    raf(function step() {
      virtual += 1000 / 60;
      raf(step);
    });
    // Without a running animation Chrome hands out frames at a fraction of the rate it could.
    document.addEventListener("DOMContentLoaded", () => {
      document.body.appendChild(document.createElement("i")).animate({ opacity: [0, 0.01] }, { duration: 1000, iterations: Infinity });
    });
  }
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
  let rendered = wall();
  const tick = () => {
    const at = wall();
    perf.ticks++;
    if (perf.draws !== last.draws) {
      perf.frames.push([at - rendered, perf.draws - last.draws, perf.triangles - last.triangles]);
      rendered = at;
    }
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
  const gl = renderer.getContext();
  const gpu = gl.getParameter(gl.getExtension("WEBGL_debug_renderer_info")?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER);
  return { ...stats, ...renderer.info.memory, programs: renderer.info.programs.length, pixelRatio: renderer.getPixelRatio(), gpu };
};

const browser = await chromium.launch({
  headless: !values.headed,
  ...(values.chrome ? { executablePath: values.chrome } : { channel: "chrome" }),
  args: [...(values.software ? softwareGl : []), ...(values.uncapped ? noVsync : [])],
});
const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
await page.addInitScript(instrument, values.uncapped);
const cdp = await page.context().newCDPSession(page);
await cdp.send("Performance.enable");
const busy = async () => {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(metrics.map(({ name, value }) => [name, value]));
};

const report = { url: values.url, viewport, states: {} };
// Uncapped, Shift is tapped while waiting: the app ignores the key, but the pacer takes it for a visitor and asks for every frame.
const wait = async (ms) => {
  for (const until = Date.now() + ms; values.uncapped && Date.now() < until - 100; ) {
    await page.keyboard.press("Shift");
    await page.waitForTimeout(100);
  }
  if (!values.uncapped) await page.waitForTimeout(ms);
};
const measure = async (state, during = () => wait(seconds * 1000)) => {
  const before = await busy();
  const from = await page.evaluate(() => Object.assign(window.__perf, { ticks: 0, frames: [] }).wall());
  await during();
  const { ticks, frames, elapsed, pixelRatio } = await page.evaluate((from) => {
    const { ticks, frames, wall, seen } = window.__perf;
    return { ticks, frames: frames.slice(1), elapsed: (wall() - from) / 1000, pixelRatio: seen.renderers[0].getPixelRatio() };
  }, from);
  const after = await busy();
  const sorted = (column) => frames.map((frame) => frame[column]).sort((a, b) => a - b);
  const quantile = (column, q) => sorted(column)[Math.floor((frames.length - 1) * q)] ?? 0;
  const mainThread = after.TaskDuration - before.TaskDuration;
  report.states[state] = {
    displayFps: +(ticks / elapsed).toFixed(1),
    renderedFps: +(frames.length / elapsed).toFixed(1),
    pixelRatio,
    drawsPerFrame: quantile(1, 0.5),
    trianglesPerFrame: Math.round(quantile(2, 0.5)),
    mainThreadBusy: +(mainThread / elapsed).toFixed(2),
    frameMs: +quantile(0, 0.5).toFixed(2),
    frameMsP95: +quantile(0, 0.95).toFixed(2),
    frameMsWorst: +quantile(0, 1).toFixed(2),
  };
  console.log(state.padEnd(10), JSON.stringify(report.states[state]));
};

await cdp.send("Network.enable");
const transferred = { script: 0, all: 0 };
const scripts = new Set();
cdp.on("Network.responseReceived", ({ requestId, type }) => type === "Script" && scripts.add(requestId));
cdp.on("Network.loadingFinished", ({ requestId, encodedDataLength }) => {
  transferred.all += encodedDataLength;
  if (scripts.has(requestId)) transferred.script += encodedDataLength;
});

const started = Date.now();
await page.goto(`${values.url}/${values.locale}/`, { waitUntil: "load" });
await page.waitForSelector('[role="status"][aria-hidden="true"]', { state: "attached", timeout: 600_000 });
const readyMs = Date.now() - started;
await page.waitForTimeout(3000);
const longTasks = await page.evaluate(() => window.__perf.longTasks);
report.load = {
  readyMs,
  scriptKb: Math.round(transferred.script / 1024),
  transferredKb: Math.round(transferred.all / 1024),
  longTasksMs: Math.round(longTasks.reduce((sum, duration) => sum + duration, 0)),
  longestTaskMs: Math.round(Math.max(0, ...longTasks)),
};
console.log("load      ", JSON.stringify(report.load));
report.scene = await page.evaluate(sceneStats);
console.log("scene     ", JSON.stringify(report.scene));

const chapters = page.locator("ol button");
await measure("intro");
await measure("travel", async () => {
  await chapters.nth(2).click({ force: true });
  await wait(3000);
});
await page.waitForTimeout(9000);
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
