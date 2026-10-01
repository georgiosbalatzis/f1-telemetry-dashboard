// P0-03: performance metrics against the production build (Chromium). Writes .perf-baseline/metrics-<label>.json
//   node scripts/perf-metrics.mjs --label=before          live OpenF1 (needed to see 429s and request counts)
//   node scripts/perf-metrics.mjs --label=after --replay  recorded responses (no network noise)
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';
import { BASE_PATH, OUT, ROOT, SCOPE, arg, dashboardUrl, replayOpenF1, settle, startServer } from './lib.mjs';

const label = String(arg('label', 'before'));
const replay = Boolean(arg('replay', false));

// Runs before the app: counts history.replaceState, long tasks, layout shifts (with sources) and LCP.
const observers = () => {
  const m = (window.__m = { replaceState: 0, longTasks: [], cls: 0, shifts: [], lcp: null });
  const replaceState = history.replaceState.bind(history);
  history.replaceState = (...args) => { m.replaceState += 1; return replaceState(...args); };
  const watch = (type, fn) => { try { new PerformanceObserver((list) => list.getEntries().forEach(fn)).observe({ type, buffered: true }); } catch { /* unsupported */ } };
  watch('longtask', (e) => m.longTasks.push(Math.round(e.duration)));
  watch('layout-shift', (e) => {
    if (e.hadRecentInput) return;
    m.cls += e.value;
    m.shifts.push({ value: +e.value.toFixed(4), at: Math.round(e.startTime), nodes: (e.sources || []).map((s) => (s.node ? `${s.node.tagName}.${String(s.node.className || '').slice(0, 40)}` : '?')) });
  });
  watch('largest-contentful-paint', (e) => { m.lcp = { at: Math.round(e.startTime), el: `${e.element?.tagName}.${String(e.element?.className || '').slice(0, 30)}` }; });
};
const read = (page) => page.evaluate(() => ({ ...window.__m, cls: +window.__m.cls.toFixed(4), fcp: Math.round(performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint')?.startTime ?? 0) }));
const reset = (page) => page.evaluate(() => { Object.assign(window.__m, { replaceState: 0, longTasks: [], shifts: [], cls: 0 }); });

/** Gzip size of everything index.html loads before first paint (entry script, modulepreloads, stylesheets). */
async function initialAssets() {
  const html = await readFile(join(ROOT, 'dist/index.html'), 'utf8');
  const files = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1].replace(BASE_PATH, ''));
  const sizes = {};
  for (const f of files) sizes[f.replace(/^assets\//, '')] = gzipSync(await readFile(join(ROOT, 'dist', f))).length;
  const total = (ext) => Object.entries(sizes).filter(([k]) => k.endsWith(ext)).reduce((s, [, v]) => s + v, 0);
  return { files: sizes, jsGzipKB: +(total('.js') / 1024).toFixed(1), cssGzipKB: +(total('.css') / 1024).toFixed(1) };
}

function trackNetwork(page) {
  const net = { openf1: {}, status429: 0 };
  page.on('request', (req) => { if (req.url().includes('api.openf1.org')) { const ep = new URL(req.url()).pathname.split('/').pop(); net.openf1[ep] = (net.openf1[ep] || 0) + 1; } });
  page.on('response', (res) => { if (res.url().includes('api.openf1.org') && res.status() === 429) net.status429 += 1; });
  return net;
}

async function loadPass(browser, server, viewport) {
  const context = await browser.newContext({ viewport });
  if (replay) await replayOpenF1(context);
  const page = await context.newPage();
  await page.addInitScript(observers);
  const net = trackNetwork(page);
  const t0 = Date.now();
  await page.goto(dashboardUrl(server.url), { waitUntil: 'load' });
  await page.locator('.recharts-wrapper').first().waitFor({ timeout: 60000 }).catch(() => {});
  const chartsVisibleMs = Date.now() - t0;
  await settle(page);
  const result = { viewport, chartsVisibleMs, ...(await read(page)), requests: { ...net.openf1 }, status429: net.status429 };
  return { context, page, net, result };
}

const server = await startServer();
const browser = await chromium.launch();
const out = { label, replay, date: new Date().toISOString(), scope: SCOPE, bundle: await initialAssets() };
try {
  const mobile = await loadPass(browser, server, { width: 390, height: 844 });
  out.coldLoadMobile = mobile.result;
  await mobile.context.close();

  const desktop = await loadPass(browser, server, { width: 1366, height: 900 });
  out.coldLoadDesktop = desktop.result;
  const { page, net } = desktop;

  // 15 lap steps with the arrow keys on the lap strip.
  await reset(page);
  const before = { ...net.openf1 };
  await page.locator('.lap-strip-bars button[aria-pressed="true"]').focus();
  const t0 = Date.now();
  for (let i = 0; i < 15; i += 1) await page.keyboard.press('ArrowLeft');
  const pressMs = Date.now() - t0;
  await settle(page);
  const delta = Object.fromEntries(Object.entries(net.openf1).map(([k, v]) => [k, v - (before[k] || 0)]).filter(([, v]) => v > 0));
  out.fifteenLapSteps = { pressMs, requests: delta, ...(await read(page)) };

  // Tab switches and theme toggle at 6× CPU throttle.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  out.throttled6x = {};
  const tabs = page.locator('.tab-strip button');
  for (const [name, index] of [['energy', 1], ['telemetry', 0], ['broadcast', 9], ['telemetryAgain', 0]]) {
    await reset(page);
    await tabs.nth(index).click();
    await settle(page);
    out.throttled6x[name] = { longTasks: (await read(page)).longTasks };
  }
  await reset(page);
  await page.locator('.theme-toggle').click();
  await page.waitForTimeout(1500);
  out.throttled6x.themeToggle = { longTasks: (await read(page)).longTasks };
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await desktop.context.close();
} finally {
  await browser.close();
  server.stop();
}

await mkdir(OUT, { recursive: true });
const file = join(OUT, `metrics-${label}.json`);
await writeFile(file, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
console.log(`\nSaved ${file}`);
