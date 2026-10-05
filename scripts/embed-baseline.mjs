// Offline, real-article embed baseline. Run before/after changes; never rewrites article sources.
// node scripts/embed-baseline.mjs --phase=before [--article-root=/path/to/f1StoriesPage]
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { chromium } from 'playwright';
import { ROOT, settle, arg } from './lib.mjs';

const fixture = JSON.parse(await readFile(join(ROOT, 'src/embeds/__tests__/fixtures/openf1-monza.json'), 'utf8'));
const articleRoot = resolve(String(arg('article-root', join(ROOT, '../f1StoriesPage'))));
const phase = String(arg('phase', 'before'));
if (!['before', 'after'].includes(phase)) throw new Error('phase must be before or after');
const output = join(ROOT, 'docs/embeds', phase);
await mkdir(output, { recursive: true });
const sourcePath = 'blog-module/blog-entries/20260927G/source.txt';
const source = await readFile(join(articleRoot, sourcePath), 'utf8');
if (!source.includes('#telemetry-throttle-brake')) throw new Error('Baku pilot marker missing');
const articlePath = '/blog-module/blog-entries/20260927G/article.html';
const original = await readFile(join(articleRoot, articlePath), 'utf8');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const host = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const appRequest = pathname.startsWith('/f1-telemetry-dashboard/');
  const root = appRequest ? join(ROOT, 'dist') : articleRoot;
  const relative = appRequest ? pathname.slice('/f1-telemetry-dashboard/'.length) || 'index.html' : '.' + pathname;
  const path = resolve(root, relative);
  if (!path.startsWith(root + '/')) { response.writeHead(403).end(); return; }
  try {
    const body = await readFile(path);
    response.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream' }).end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise((done) => host.listen(0, '127.0.0.1', done));
const hostUrl = `http://127.0.0.1:${host.address().port}`;
const appUrl = hostUrl + '/f1-telemetry-dashboard/';
const browser = await chromium.launch();
const measurements = [];
try {
  for (const width of [390, 1440]) for (const panel of ['telemetry-speed-trace', 'telemetry-throttle-brake', 'whole-tab']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const requests = [];
    await context.route('https://api.openf1.org/**', async (route) => {
      const url = new URL(route.request().url());
      requests.push(url.pathname + url.search);
      const endpoint = url.pathname.split('/').at(-1);
      let records = fixture[endpoint] || [];
      const driver = url.searchParams.get('driver_number');
      if (driver) records = records.filter((row) => row.driver_number === Number(driver));
      // A response only exists for the recorded lap; mismatched windows fail instead of returning misleading data.
      // '+' is a literal timezone offset in the existing operator-query format, not a form-encoded space.
      const parameters = new URLSearchParams(url.search.replace(/\+/g, '%2B'));
      const start = parameters.get('date>');
      const end = parameters.get('date<');
      if (endpoint === 'car_data') {
        const lap = fixture.laps.find((lap) => lap.driver_number === Number(driver) && lap.lap_number === 52);
        if (!start || !end || Date.parse(start) !== Date.parse(lap?.date_start)) {
          await route.fulfill({ status: 404, json: { error: 'No recorded telemetry for this window' } });
          return;
        }
        records = records.filter((row) => Date.parse(row.date) >= Date.parse(start) && Date.parse(row.date) <= Date.parse(end));
      }
      await route.fulfill({ json: records, headers: { 'access-control-allow-origin': '*' } });
    });
    const scope = 'year=2025&circuit=Monza&session=9912&drivers=1,4&lap=52&tab=telemetry&embed=1&theme=light';
    const embedUrl = `${appUrl}?${scope}${panel === 'whole-tab' ? '' : '#' + panel}`;
    await context.route(hostUrl + articlePath, (route) => route.fulfill({
      contentType: 'text/html',
      body: original.replace(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*>/gi, '')
        .replace(/src="https:\/\/georgiosbalatzis\.github\.io\/f1-telemetry-dashboard\/[^\"]*"/g, `src="${embedUrl}"`)
        .replace(/height="720"/g, `height="${panel === 'whole-tab' ? 920 : 720}"`),
    }));
    // External article widgets/analytics are unrelated to telemetry and are blocked in this offline capture.
    await context.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(hostUrl) || url.startsWith(appUrl) || url.startsWith('https://api.openf1.org/')) return route.fallback();
      return route.abort();
    });
    const page = await context.newPage();
    await page.goto(hostUrl + articlePath);
    const frameElement = page.locator('iframe[src*="embed=1"]').first();
    await frameElement.waitFor();
    const frame = await (await frameElement.elementHandle()).contentFrame();
    await settle(frame);
    await frame.waitForFunction(() => document.querySelectorAll('.recharts-line-curve,.recharts-area-area').length > 0, null, { timeout: 10000 }).catch(async (error) => {
      console.log(JSON.stringify({ url: frame.url(), text: await frame.locator('body').innerText(), requests }, null, 2));
      throw error;
    });
    await frameElement.scrollIntoViewIfNeeded();
    const name = `${panel}-${width}`;
    await frameElement.screenshot({ path: join(output, name + '.png'), animations: 'disabled' });
    const inside = await frame.evaluate(() => ({
      contentHeight: document.documentElement.scrollHeight,
      viewportHeight: innerHeight,
      viewportWidth: innerWidth,
      panelCount: document.querySelectorAll('.dashboard-panel').length,
      theme: document.documentElement.getAttribute('data-theme'),
      bars: document.querySelectorAll('.embed-bar').length,
      overflowX: document.documentElement.scrollWidth > innerWidth,
    }));
    const bounds = await frameElement.boundingBox();
    measurements.push({ name, articleViewport: width, iframe: bounds, ...inside, nestedVerticalScroll: inside.contentHeight > inside.viewportHeight, apiRequests: requests.length, requests });
    await context.close();
  }
  await writeFile(join(output, 'measurements.json'), JSON.stringify({ phase, fixture: fixture.provenance, pilotSource: sourcePath, measurements }, null, 2) + '\n');
  console.log(JSON.stringify(measurements.map(({ name, contentHeight, viewportHeight, viewportWidth, nestedVerticalScroll, apiRequests }) => ({ name, contentHeight, viewportHeight, viewportWidth, nestedVerticalScroll, apiRequests })), null, 2));
} finally {
  await browser.close();
  await new Promise((done) => host.close(done));
}
