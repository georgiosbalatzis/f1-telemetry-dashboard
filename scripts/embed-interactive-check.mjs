import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { setupTelemetryFigures } = require(path.join(root, '../f1StoriesPage/blog-module/blog/article-script.js'));
const speed = JSON.parse(readFileSync(path.join(root, 'src/embeds/__tests__/fixtures/publication-v1.json'), 'utf8'));
const pedals = structuredClone(speed);
pedals.panelId = 'telemetry-throttle-brake'; pedals.data.kind = 'pedals'; pedals.editorial.title = 'Επιθεώρηση γκαζιού και φρένου';
pedals.data.points = pedals.data.points.map(point => {
  const result = { progress: point.progress };
  for (const driver of pedals.data.drivers) {
    const speedValue = point[`speed_${driver.number}`];
    result[`throttle_${driver.number}`] = speedValue == null ? null : Math.min(100, speedValue / 3.7);
    result[`brake_${driver.number}`] = speedValue == null ? null : -Math.max(0, 100 - speedValue / 3.7);
  }
  return result;
});
pedals.context.session = 'Race'; pedals.scope.sessionKey += 1; pedals.scope.lapNum -= 1;
const stripImages = ({ images: _images, ...payload }) => payload;
const bundles = { speed: JSON.stringify(stripImages(speed)), pedals: JSON.stringify(stripImages(pedals)) };
const manifest = readFileSync(path.join(root, 'dist/interactive/manifest.json'));
const screenshotDir = path.join(root, 'docs/embeds/article-release-b');
mkdirSync(screenshotDir, { recursive: true });
const resourceCounts = new Map();
const resourceBytes = new Map();
function staticChart(bundle, theme) {
  const keys = bundle.data.kind === 'speed' ? [`speed_${bundle.data.drivers[0].number}`] : [`throttle_${bundle.data.drivers[0].number}`];
  const values = bundle.data.points.map(point => point[keys[0]]).filter(value => typeof value === 'number');
  const max = bundle.data.kind === 'speed' ? 370 : 100; const min = 0;
  const points = values.map((value, index) => `${24 + index * 2.25},${204 - (value - min) / (max - min) * 168}`).join(' ');
  const color = theme === 'dark' ? '#88aaff' : '#e10600';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="${theme === 'dark' ? '#171b18' : '#fff'}"/><g stroke="#9aa39b" stroke-width="1"><path d="M24 36H312M24 92H312M24 148H312M24 204H312"/></g><polyline fill="none" stroke="${color}" stroke-width="2.5" points="${points}"/><text x="24" y="229" font-family="sans-serif" font-size="10" fill="#59625b">Saved static ${bundle.data.kind} trace</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
const html = `<!doctype html><html data-theme="dark"><meta charset="utf-8"><title>Interactive article fixture</title><style>
:root{font:16px/1.5 system-ui;color:#20251f;background:#fff}body{max-width:700px;margin:24px auto}.f1-telemetry-figure{border-block:1px solid;padding:16px;margin:24px 0}.f1-telemetry-picture{display:block}.f1-telemetry-image{display:block;width:100%;height:auto;aspect-ratio:4/3}.f1-telemetry-interactive .f1-telemetry-picture{display:none}.f1-telemetry-interactive-toggle{min-height:44px}.f1-telemetry-interactive-host{margin:12px 0}:root:not([data-theme=light]) .f1-telemetry-picture--light{display:none}:root[data-theme=light] .f1-telemetry-picture--dark{display:none}@media print{.f1-telemetry-interactive-toggle,.f1-telemetry-interactive-status,.f1-telemetry-interactive-host{display:none!important}.f1-telemetry-picture--light{display:block!important}.f1-telemetry-picture--dark{display:none!important}}
</style><main data-test-entry="${JSON.parse(manifest.toString())['src/embeds/interactive-entry.tsx'].file}"><p id="before">Article before</p>${['speed','pedals'].map(kind=>{const bundle=kind==='speed'?speed:pedals;return `<figure class="f1-telemetry-figure" data-panel="${kind === 'speed' ? 'telemetry-speed-trace' : 'telemetry-throttle-brake'}" data-telemetry-data="/data/${kind}.json" data-runtime-manifest="/telemetry/interactive/manifest.json"><p>TELEMETRY</p><h2>${kind}</h2><p>Saved context</p><picture class="f1-telemetry-picture f1-telemetry-picture--light"><img class="f1-telemetry-image" width="320" height="240" alt="Saved static ${kind} figure" src="${staticChart(bundle,'light')}"></picture><picture class="f1-telemetry-picture f1-telemetry-picture--dark"><img class="f1-telemetry-image" width="320" height="240" alt="Saved static ${kind} figure" src="${staticChart(bundle,'dark')}"></picture><p class="f1-telemetry-source">OpenF1 · saved source</p><figcaption>Saved caption remains available.</figcaption><p><a href="/analysis?session=9912#telemetry">Open full analysis</a></p></figure>`}).join('')}<p id="after">Article after</p></main></html>`;
function count(pathname, bytes = 0) { resourceCounts.set(pathname, (resourceCounts.get(pathname) || 0) + 1); resourceBytes.set(pathname, bytes); }
const server = createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/') { count(pathname); res.writeHead(200, { 'content-type': 'text/html' }); res.end(html); return; }
  if (pathname === '/telemetry/interactive/manifest.json') { count(pathname, manifest.length); res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end(manifest); return; }
  if (pathname === '/data/speed.json' || pathname === '/data/pedals.json') { const body = bundles[pathname.includes('speed') ? 'speed' : 'pedals']; count(pathname, Buffer.byteLength(body)); res.writeHead(200, { 'content-type': 'application/json' }); res.end(body); return; }
  if (pathname.startsWith('/telemetry/interactive/assets/')) { const file = path.join(root, 'dist/interactive', pathname.slice('/telemetry/interactive/'.length)); try { const body = readFileSync(file); count(pathname, body.length); res.writeHead(200, { 'content-type': 'text/javascript', 'access-control-allow-origin': '*' }); res.end(body); } catch { res.writeHead(404); res.end(); } return; }
  res.writeHead(404); res.end();
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const results = [];
try {
  for (const engine of [chromium, firefox, webkit]) {
    resourceCounts.clear(); resourceBytes.clear();
    const browser = await engine.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
    const page = await context.newPage(); const apiCalls = [];
    await page.route('**/*', route => { if (/openf1/i.test(route.request().url())) { apiCalls.push(route.request().url()); return route.abort(); } return route.continue(); });
    page.on('console', message => console.log(`${engine.name()} console: ${message.type()} ${message.text()}`)); page.on('pageerror', error => console.log(`${engine.name()} pageerror: ${error.stack}`));
    await page.goto(`${base}?story=3#section`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; window.__figureShift = 0; window.__figureCls = 0; try { new PerformanceObserver(list => list.getEntries().forEach(entry => { window.__figureShift += entry.value; if (!entry.hadRecentInput) window.__figureCls += entry.value; })).observe({ type: 'layout-shift', buffered: true }); } catch {} });
    const startUrl = page.url(); await page.evaluate(() => localStorage.setItem('theme', 'persist'));
    await page.addScriptTag({ content: `window.__cleanupFigures = (${setupTelemetryFigures.toString()})(document.querySelector('main'), document, window);` });
    if (await page.locator('.f1-telemetry-figure button').count() !== 2) throw new Error(`${engine.name()}: no progressive Explore buttons`);
    if (resourceCounts.get('/telemetry/interactive/manifest.json')) throw new Error(`${engine.name()}: runtime requested before activation`);
    const before = await page.locator('#after').evaluate(node => node.getBoundingClientRect().top + window.scrollY); const beforeFigure = await page.locator('.f1-telemetry-figure').nth(0).boundingBox(); const started = performance.now();
    await page.locator('.f1-telemetry-figure').nth(0).locator('button').click();
    const firstHost = page.locator('.f1-telemetry-figure').nth(0).locator('.f1-telemetry-interactive-host');
    try { await page.waitForFunction(node => !!node.shadowRoot?.querySelector('section'), await firstHost.elementHandle(), { timeout: 7000 }); } catch (error) { console.log('DEBUG', engine.name(), await firstHost.evaluate(node => ({ children: node.childElementCount, text: node.textContent, status: node.closest('figure').querySelector('[role=status]')?.textContent, button: node.closest('figure').querySelector('button')?.textContent })), await page.evaluate(async () => { try { const m = await import(location.origin + '/telemetry/interactive/' + document.querySelector('main').getAttribute('data-test-entry')); const host=document.createElement('div'); document.body.append(host); try {m.mount(host, await (await fetch('/data/speed.json')).json(), {theme:'dark'}); return {keys:Object.keys(m),shadow:host.shadowRoot?.innerHTML.slice(0,500)};} catch(e) { return String(e.stack || e); }} catch(e) { return String(e.stack || e); } }), [...resourceCounts]); throw error; }
    const firstReady = performance.now(); const afterActivationY = await page.locator('#after').evaluate(node => node.getBoundingClientRect().top + window.scrollY);
    if (!resourceCounts.get('/telemetry/interactive/manifest.json')) throw new Error(`${engine.name()}: manifest did not load on activation`);
    if (!resourceCounts.get('/data/speed.json')) throw new Error(`${engine.name()}: plotted data did not load on activation`);
    if (await firstHost.evaluate(node => node.shadowRoot.querySelector('details table tbody tr') == null)) throw new Error(`${engine.name()}: inspector table missing`);
    const slider = firstHost.locator('input[type=range]'); await slider.focus(); await slider.press('End');
    const last = await slider.inputValue(); if (Number(last) < 2) throw new Error(`${engine.name()}: End did not move inspection point`);
    await slider.press('ArrowLeft'); if (Number(await slider.inputValue()) !== Number(last) - 1) throw new Error(`${engine.name()}: arrow keys did not move inspection point`); await slider.press('Home'); if (Number(await slider.inputValue()) !== 0) throw new Error(`${engine.name()}: Home did not move to the first point`);
    const afterEnd = await firstHost.evaluate(node => node.shadowRoot.querySelector('[role=status]').textContent);
    if (!afterEnd.includes('km/h')) throw new Error(`${engine.name()}: speed units are missing from the readout`);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForFunction(node => node.shadowRoot.querySelector('section')?.getAttribute('data-theme') === 'light', await firstHost.elementHandle());
    const narrowWidth = Number(await firstHost.evaluate(node => node.shadowRoot.querySelector('svg.recharts-surface').getAttribute('width'))); await firstHost.evaluate(node => { window.__responsiveHost = node; }); await page.setViewportSize({ width: 1440, height: 900 }); try { await page.waitForFunction(node => Number(node.shadowRoot.querySelector('svg.recharts-surface')?.getAttribute('width')) > 600, await firstHost.elementHandle(), { timeout: 5000 }); } catch (error) { console.log('resize debug', engine.name(), await firstHost.evaluate(node => ({ width: node.getBoundingClientRect().width, chart: node.shadowRoot.querySelector('svg.recharts-surface')?.getAttribute('width') }))); throw error; } const wideWidth = Number(await firstHost.evaluate(node => node.shadowRoot.querySelector('svg.recharts-surface').getAttribute('width'))); if (narrowWidth >= wideWidth) throw new Error(`${engine.name()}: figure did not resize from narrow to wide`); await page.setViewportSize({ width: 390, height: 900 }); try { await page.waitForFunction(width => Number(window.__responsiveHost.shadowRoot.querySelector('svg.recharts-surface')?.getAttribute('width')) === width, narrowWidth, { timeout: 5000 }); } catch (error) { console.log('return resize debug', engine.name(), narrowWidth, await firstHost.evaluate(node => ({ width: node.getBoundingClientRect().width, chart: node.shadowRoot.querySelector('svg.recharts-surface')?.getAttribute('width') }))); throw error; }
    await page.locator('.f1-telemetry-figure').nth(1).locator('button').click();
    const secondHost = page.locator('.f1-telemetry-figure').nth(1).locator('.f1-telemetry-interactive-host');
    await page.waitForFunction(node => !!node.shadowRoot?.querySelector('section'), await secondHost.elementHandle());
    const pedalSlider = secondHost.locator('input[type=range]'); await pedalSlider.focus(); await pedalSlider.press('End');
    const brake = await secondHost.evaluate(node => node.shadowRoot.querySelector('[role=status]').textContent);
    if (!brake.includes('brake:') || !brake.includes('%') || /brake: -/.test(brake)) throw new Error(`${engine.name()}: pedal labels/unsigned brake value are missing`);
    if (resourceCounts.get('/telemetry/interactive/manifest.json') !== 1) throw new Error(`${engine.name()}: runtime manifest was not reused`);
    if (await page.locator('.f1-telemetry-figure.f1-telemetry-interactive').count() !== 2) throw new Error(`${engine.name()}: multiple figure mount failed`);
    if (engine === chromium) await page.screenshot({ path: path.join(screenshotDir, 'interactive.png'), fullPage: true });
    const restoreButton = page.locator('.f1-telemetry-figure').nth(0).locator('button'); await restoreButton.click();
    if (await firstHost.evaluate(node => node.shadowRoot.childElementCount !== 0)) throw new Error(`${engine.name()}: static restore did not unmount shadow content`);
    if (await page.locator('.f1-telemetry-picture--light').first().evaluate(node => getComputedStyle(node).display === 'none')) throw new Error(`${engine.name()}: saved light fallback did not return`);
    await page.emulateMedia({ reducedMotion: 'reduce' }); if (!(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches))) throw new Error(`${engine.name()}: reduced-motion mode was not respected`); await page.emulateMedia({ reducedMotion: 'no-preference' });
    if (!(await restoreButton.evaluate(button => button === document.activeElement))) throw new Error(`${engine.name()}: focus was not restored to the static toggle`);
    const detachedFigure = await page.locator('.f1-telemetry-figure').nth(1).elementHandle(); const detachedHost = await secondHost.elementHandle(); await detachedFigure.evaluate(figure => figure.remove());
    await page.waitForFunction(({ figure, host }) => !figure.querySelector('button') && host.shadowRoot.childElementCount === 0, { figure: detachedFigure, host: detachedHost });
    await page.evaluate(figure => document.querySelector('main').append(figure), detachedFigure);
    await page.locator('.f1-telemetry-figure').nth(1).locator('button').waitFor();
    await page.emulateMedia({ media: 'print' });
    const printDisplay = await page.locator('.f1-telemetry-figure').nth(0).locator('.f1-telemetry-picture--light').evaluate(node => getComputedStyle(node).display);
    if (printDisplay === 'none') throw new Error(`${engine.name()}: print does not restore light static image`);
    await page.emulateMedia({ media: 'screen' });
    const articleState = await page.evaluate(() => ({ href: location.href, theme: document.documentElement.getAttribute('data-theme'), storage: localStorage.getItem('theme') }));
    if (articleState.href !== startUrl || articleState.theme !== 'light' || articleState.storage !== 'persist') throw new Error(`${engine.name()}: article URL or stored theme changed`);
    if (apiCalls.length) throw new Error(`${engine.name()}: OpenF1 request observed`);
    const shifts = await page.evaluate(() => ({ all: window.__figureShift, cls: window.__figureCls }));
    results.push({ engine: engine.name(), interactiveMs: Math.round(firstReady - started), beforeFigureY: Math.round(beforeFigure.y), afterParagraphShiftPx: Math.round(afterActivationY - before), observedLayoutShift: Number(shifts.all.toFixed(4)), cls: Number(shifts.cls.toFixed(4)), requests: Object.fromEntries([...resourceCounts]), API: apiCalls.length });
    await context.close();
    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
    const staticPage = await noJs.newPage(); await staticPage.goto(base);
    if (await staticPage.locator('button').count()) throw new Error(`${engine.name()}: JavaScript-disabled article contains dead controls`);
    if (!(await staticPage.locator('img[alt^="Saved static"]').count())) throw new Error(`${engine.name()}: JS-disabled static fallback missing`);
    if (engine === chromium) await staticPage.screenshot({ path: path.join(screenshotDir, 'static-no-js.png'), fullPage: true });
    await noJs.close(); await browser.close();
  }
  const entry = JSON.parse(manifest.toString())['src/embeds/interactive-entry.tsx'].file;
  const runtime = readFileSync(path.join(root, 'dist/interactive', entry));
  const sizes = {
    moduleGzip: gzipSync(runtime).length,
    moduleBytes: runtime.length,
    speedDataGzip: gzipSync(bundles.speed).length,
    pedalsDataGzip: gzipSync(bundles.pedals).length,
    dataBytes: { speed: Buffer.byteLength(bundles.speed), pedals: Buffer.byteLength(bundles.pedals) },
    selectedSvgGzip: Object.fromEntries(Object.entries(speed.images).map(([key, value]) => [key, gzipSync(value.svg).length])),
  };
  console.log(JSON.stringify({ results, sizes }, null, 2));
} finally {
  await new Promise(resolve => server.close(resolve));
}
