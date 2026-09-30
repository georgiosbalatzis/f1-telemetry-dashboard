// P0-04: proves render stability. Runs the dev server with the <PerfProbe> enabled and counts TelemetryTab commits.
//   node scripts/render-probe.mjs
// Expected after Phase 1 (P1-05): 0 commits while typing in the preset box or showing/clearing a toast.
import { chromium } from 'playwright';
import { dashboardUrl, replayOpenF1, settle, startServer } from './lib.mjs';

const server = await startServer({ dev: true });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await replayOpenF1(context);
  await context.addInitScript(() => localStorage.setItem('perfProbe', '1'));
  const page = await context.newPage();
  await page.goto(dashboardUrl(server.url));
  await settle(page);
  const commits = () => page.evaluate(() => window.__perfCommits?.TelemetryTab ?? 0);
  const out = { afterLoad: await commits() };

  await page.locator('.utility-menu > summary').click();
  let mark = await commits();
  await page.locator('#preset-name').pressSequentially('abcdefghij', { delay: 30 });
  out.tenKeystrokes = (await commits()) - mark;

  mark = await commits();
  await page.getByRole('button', { name: /save|αποθήκευση/i }).first().click(); // shows a toast, then clears it (2.6 s)
  await page.waitForTimeout(3200);
  out.toastShowAndClear = (await commits()) - mark;

  console.log(JSON.stringify({ telemetryTabCommits: out }, null, 2));
} finally {
  await browser.close();
  server.stop();
}
