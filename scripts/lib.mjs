// Shared helpers for the perf scripts (dev-only, never bundled). See PERFREDO.md Phase 0.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = join(ROOT, '.perf-baseline');
export const BASE_PATH = '/f1-telemetry-dashboard/';
/** One fixed, historical scope so the data never changes between runs. */
export const SCOPE = 'year=2025&circuit=Monza&session=9912&drivers=1,4&lap=52';
export const TABS = ['telemetry', 'energy', 'trackmap', 'positions', 'intervals', 'tires', 'radio', 'incidents', 'weather', 'broadcast'];
export const VIEWPORTS = [{ w: 390, h: 844 }, { w: 820, h: 1180 }, { w: 1440, h: 900 }];
export const FIXED_TIME = new Date('2026-09-30T12:00:00Z');

export const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.includes('=') ? hit.split('=')[1] : true;
};
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Starts `vite preview` (needs a fresh `npm run build`) or `vite dev`, resolves with { url, stop }. */
export async function startServer({ dev = false, port = dev ? 4180 : 4179 } = {}) {
  if (!dev && !existsSync(join(ROOT, 'dist/index.html'))) throw new Error('dist/ missing: run `npm run build` first');
  const proc = spawn('npx', ['vite', ...(dev ? [] : ['preview']), '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  const url = `http://localhost:${port}${BASE_PATH}`;
  for (let i = 0; i < 100; i += 1) {
    try { if ((await fetch(url)).ok) return { url, stop: () => proc.kill('SIGTERM') }; } catch { /* not up yet */ }
    await sleep(300);
  }
  proc.kill('SIGTERM');
  throw new Error('server did not start');
}

// ─── OpenF1 record/replay ────────────────────────────────────────────────────
// First run records each API response to .perf-baseline/fixtures (paced, 429-safe); later runs replay it,
// so screenshots are identical across engines and never depend on the live API.

const FIXTURES = join(OUT, 'fixtures');
const fixturePath = (url) => join(FIXTURES, `${createHash('sha1').update(url).digest('hex')}.json`);
let lastFetch = 0;

async function record(url) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await sleep(Math.max(0, lastFetch + 450 - Date.now()));
    lastFetch = Date.now();
    const res = await fetch(url);
    if (res.status === 429) { await sleep(3000 * (attempt + 1)); continue; }
    const body = await res.text();
    const entry = { status: res.status, body };
    if (res.ok) { await mkdir(FIXTURES, { recursive: true }); await writeFile(fixturePath(url), JSON.stringify(entry)); }
    return entry;
  }
  return { status: 429, body: '[]' };
}

export async function replayOpenF1(context) {
  await context.route('https://api.openf1.org/**', async (route) => {
    const url = route.request().url();
    const file = fixturePath(url);
    const entry = existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : await record(url);
    await route.fulfill({ status: entry.status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: entry.body });
  });
}

/** Freezes Date.now() so the masthead countdown and "next meeting" cannot change between runs. */
export const freezeTime = (page) => page.clock.setFixedTime(FIXED_TIME);

export const dashboardUrl = (base, { tab = 'telemetry', theme = 'light', scope = SCOPE } = {}) => `${base}?${scope}&tab=${tab}&theme=${theme}`;

/** Waits until the page has stopped loading: network idle, no skeletons left, fonts ready. */
export async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('[role="status"][aria-label]').first().waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  // fonts.ready can resolve before lazily requested faces start loading, so load the ones the page uses explicitly.
  await page.evaluate(() => Promise.all(['700 64px "Barlow Condensed"', '400 16px "IBM Plex Sans"', '600 16px "IBM Plex Sans"', '400 16px "IBM Plex Sans" Τηλεμετρία'].map((f) => document.fonts.load(f.replace(/ Τηλεμετρία$/, ''), f.endsWith('Τηλεμετρία') ? 'Τηλεμετρία' : undefined))).then(() => document.fonts.ready));
  await page.locator('.session-status:not(:empty)').first().waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  // Layout must hold still: same page height for 5 consecutive samples (1 s).
  let last = -1;
  let steady = 0;
  for (let i = 0; i < 60 && steady < 5; i += 1) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    steady = height === last ? steady + 1 : 0;
    last = height;
    await page.waitForTimeout(200);
  }
}
