// P0-02: screenshot every tab × theme × viewport × engine.
//   node scripts/visual-baseline.mjs                      writes  .perf-baseline/<engine>/…  (the baseline)
//   node scripts/visual-baseline.mjs --compare            writes  .perf-baseline/current/…  and diffs against the baseline
// WebKit headless jitters on its own (text/page height shifts of a few px between identical runs), so its diffs are advisory
// unless --strict-webkit is passed. Chromium and Firefox are strict gates.
// Options: --strict-webkit  --engines=chromium,webkit,firefox  --tabs=telemetry,energy  --themes=light  --widths=390,1440  --threshold=0.1
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { OUT, TABS, VIEWPORTS, arg, dashboardUrl, freezeTime, replayOpenF1, settle, startServer } from './lib.mjs';

const launchers = { chromium, firefox, webkit };
const engines = String(arg('engines', 'chromium,webkit,firefox')).split(',');
const tabs = String(arg('tabs', TABS.join(','))).split(',');
const themes = String(arg('themes', 'light,dark')).split(',');
const widths = arg('widths') ? String(arg('widths')).split(',').map(Number) : VIEWPORTS.map((v) => v.w);
const compare = Boolean(arg('compare', false));
const threshold = Number(arg('threshold', 0.1)); // max % of differing pixels
const dir = (engine) => join(OUT, compare ? 'current' : '', engine);

const server = await startServer();
const shots = [];
try {
  for (const engine of engines) {
    const browser = await launchers[engine].launch();
    await mkdir(dir(engine), { recursive: true });
    for (const w of widths) {
      const viewport = VIEWPORTS.find((v) => v.w === w) ?? { w, h: 900 };
      const context = await browser.newContext({ viewport: { width: viewport.w, height: viewport.h }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
      await replayOpenF1(context);
      const page = await context.newPage();
      await freezeTime(page);
      for (const theme of themes) for (const tab of tabs) {
        await page.goto(dashboardUrl(server.url, { tab, theme }));
        await settle(page);
        // Full-page capture resizes the viewport to the page height; WebKit then feeds that back into 100vh min-heights
        // and the page grows by a few px. Pages are always taller than the viewport, so dropping them changes no pixels.
        await page.addStyleTag({ content: '#root, .min-h-screen, .min-h-dvh { min-height: 0 !important; }' });
        const name = `${tab}-${theme}-${w}.png`;
        await page.screenshot({ path: join(dir(engine), name), fullPage: true, animations: 'disabled' });
        shots.push([engine, name]);
        console.log(`${engine}/${name}`);
      }
      await context.close();
    }
    await browser.close();
  }

  if (compare) {
    // PNGs are decoded inside a Chromium page (canvas), so no image dependency is needed.
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const b64 = async (file) => (existsSync(file) ? (await readFile(file)).toString('base64') : null);
    let failed = 0;
    const strictWebkit = Boolean(arg('strict-webkit', false));
    const report = [];
    for (const [engine, name] of shots) {
      const [a, b] = [await b64(join(OUT, engine, name)), await b64(join(OUT, 'current', engine, name))];
      if (!a) { report.push({ engine, name, diff: 'no baseline' }); failed += 1; continue; }
      const advisory = engine === 'webkit' && !strictWebkit;
      const pct = await page.evaluate(async ([x, y]) => {
        const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `data:image/png;base64,${s}`; });
        const [ia, ib] = await Promise.all([load(x), load(y)]);
        // WebKit full-page capture can jitter the page height by a few px; compare the shared top region, flag bigger drifts.
        if (ia.width !== ib.width || Math.abs(ia.height - ib.height) > 24) return 100;
        const h = Math.min(ia.height, ib.height);
        const px = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, img.width, h).data; };
        const [da, db] = [px(ia), px(ib)];
        let n = 0;
        for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 24) n += 1;
        return (n / (da.length / 4)) * 100;
      }, [a, b]);
      if (pct > threshold) { if (!advisory) failed += 1; report.push({ engine, name, diff: `${pct.toFixed(3)}%${advisory ? ' (advisory)' : ''}` }); }
    }
    await browser.close();
    await writeFile(join(OUT, 'compare-report.json'), JSON.stringify(report, null, 2));
    console.log(failed ? `\n${failed} screenshots differ (> ${threshold}%):` : `\nNo blocking differences in ${shots.length} screenshots${report.length ? ` (${report.length} advisory)` : ''}.`);
    report.forEach((r) => console.log(`  ${r.engine}/${r.name}  ${r.diff}`));
    process.exitCode = failed ? 1 : 0;
  }
} finally {
  server.stop();
}
