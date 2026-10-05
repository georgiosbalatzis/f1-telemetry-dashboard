// Reproducible browser checks for E03. Start Vite, then run with --url=<Vite base URL>.
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { ROOT, arg } from './lib.mjs';

const url = String(arg('url', 'http://127.0.0.1:4180/f1-telemetry-dashboard/')) + 'scripts/fixtures/telemetry-plots.html?article=42#paragraph';
const output = join(ROOT, String(arg('output', 'docs/embeds/plots')));
await mkdir(output, { recursive: true });
const results = [];
for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await launcher.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    const apiRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => { if (request.url().includes('api.openf1.org')) apiRequests.push(request.url()); });
    await page.goto(url);
    await page.waitForSelector('[data-case="resize"] svg.recharts-surface');
    const initialUrl = page.url();
    const state = await page.evaluate(() => {
      const host = document.querySelector('[data-case="resize"]');
      return { theme: document.documentElement.getAttribute('data-theme'), storage: localStorage.getItem('f1stories-theme'), ticks: host.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-value').length, width: host.querySelector('svg.recharts-surface').getAttribute('width'), plots: document.querySelectorAll('svg.recharts-surface').length, traceCounts: [...document.querySelectorAll('[data-case]')].map((host) => ({ scenario: host.dataset.case, lines: host.querySelectorAll('.recharts-line-curve,.recharts-area-area').length })) };
    });
    if (state.ticks !== 5 || state.width !== '340' || state.plots !== 13) throw new Error(`${engine}: narrow container regression ${JSON.stringify(state)}`);
    await page.locator('[data-case="resize"]').evaluate((host) => { host.style.width = '680px'; });
    await page.waitForFunction(() => document.querySelector('[data-case="resize"] svg.recharts-surface').getAttribute('width') === '680');
    const wideTicks = await page.locator('[data-case="resize"] .recharts-xAxis .recharts-cartesian-axis-tick-value').count();
    if (wideTicks !== 10 || page.url() !== initialUrl) throw new Error(`${engine}: resize/location regression`);
    const uniqueIds = await page.evaluate(() => { const ids = [...document.querySelectorAll('clipPath')].map((node) => node.id); return new Set(ids).size === ids.length; });
    if (!uniqueIds || errors.length || apiRequests.length) throw new Error(`${engine}: isolation regression ${errors}`);
    await page.screenshot({ path: join(output, `${engine}.png`), fullPage: true });
    results.push({ engine, ...state, wideTicks, uniqueIds, pageErrors: errors, apiRequests });
  } finally { await browser.close(); }
}
await writeFile(join(output, 'results.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results.map(({ engine, plots, ticks, wideTicks, uniqueIds }) => ({ engine, plots, narrowTicks: ticks, wideTicks, uniqueIds })), null, 2));
