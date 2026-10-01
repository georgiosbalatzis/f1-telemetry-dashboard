// Production-build shell checks and reviewable screenshots; uses the existing OpenF1 replay.
// Run: npm run build && node scripts/shell-parity.mjs
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, firefox, webkit } from 'playwright';
import { OUT, dashboardUrl, replayOpenF1, settle, startServer } from './lib.mjs';

const labels = ['Αρχική', 'Άρθρα', 'YouTube', 'Βαθμολογία', 'Δεδομένα', 'Συντάκτες', 'BetCast'];
const server = await startServer({ port: 4181 });
try {
  for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await launcher.launch();
    try {
      const dir = join(OUT, 'shell-parity', engine);
      await mkdir(dir, { recursive: true });
      for (const width of [1440, 1280, 1024, 768, 390, 375]) for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        try {
          await replayOpenF1(context);
          // Exercise an upcoming meeting even though the visual fixtures use a historical season.
          await context.route('https://api.openf1.org/v1/meetings?year=2025', async route => {
            const hash = createHash('sha1').update(route.request().url()).digest('hex');
            const fixture = JSON.parse(await readFile(join(OUT, 'fixtures', `${hash}.json`), 'utf8'));
            const meetings = JSON.parse(fixture.body);
            meetings.push({ ...meetings[0], meeting_key: 999999, meeting_name: 'Upcoming Grand Prix with a long name', date_start: '2099-10-01T12:00:00Z' });
            await route.fulfill({ json: meetings });
          });
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          await page.goto(dashboardUrl(server.url, { theme }));
          await settle(page);
          const desktop = width >= 992;
          const menu = page.locator(desktop ? '.site-nav-links' : '.nav-mobile-panel');
          assert.deepEqual(await menu.locator('a').allTextContents(), labels);
          assert.deepEqual(await menu.locator('[aria-current="page"]').allTextContents(), ['Δεδομένα']);
          assert.equal(await page.locator('.nav-countdown').isVisible(), width >= 1200 || (width >= 576 && width < 992));
          const nav = await page.locator('.site-nav-inner').boundingBox();
          assert.equal(nav.height, desktop ? 75 : 67);
          if (desktop) {
            const links = await menu.boundingBox();
            const controls = await page.locator('.site-nav-right').boundingBox();
            assert.ok(links.x + links.width <= controls.x, 'navigation collides with countdown/controls');
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'horizontal overflow');
          await page.evaluate(() => scrollTo(0, 500));
          assert.equal((await page.locator('.site-nav').boundingBox()).y, 0, 'masthead scrolls away');
          await page.locator('.skip-link').focus();
          await page.keyboard.press('Enter');
          assert.ok((await page.locator('#main-content').boundingBox()).y >= nav.height, 'skip target hides behind masthead');
          await page.evaluate(() => scrollTo(0, 0));
          const name = `${theme}-${width}`;
          await page.locator('.site-header').screenshot({ path: join(dir, `${name}-header.png`) });
          if (!desktop) {
            const summary = page.locator('.nav-mobile > summary');
            await summary.focus();
            await page.keyboard.press('Enter');
            assert.equal(await page.locator('.nav-mobile').getAttribute('open'), '');
            await page.waitForFunction(() => document.querySelector('.nav-mobile > summary').getAttribute('aria-expanded') === 'true');
            // Safari uses Option-Tab to include links with its default keyboard preferences.
            await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab');
            assert.equal(await menu.locator('a').first().evaluate(el => el === document.activeElement), true);
            await page.screenshot({ path: join(dir, `${name}-menu.png`) });
            await page.keyboard.press('Escape');
            await page.waitForFunction(() => document.querySelector('.nav-mobile > summary').getAttribute('aria-expanded') === 'false');
            assert.equal(await page.locator('.nav-mobile').getAttribute('open'), null);
            assert.equal(await summary.evaluate(el => el === document.activeElement), true);
          }
          await page.locator('.utility-menu > summary').click();
          const tools = await page.locator('.utility-content').boundingBox();
          assert.ok(tools.x >= 0 && tools.x + tools.width <= width, 'tools popup leaves viewport');
          await page.screenshot({ path: join(dir, `${name}-tools.png`) });
          await page.keyboard.press('Escape');
          const sponsors = page.locator('.sponsor-strip');
          await sponsors.scrollIntoViewIfNeeded();
          await page.waitForFunction(() => [...document.querySelectorAll('.sponsor-logo img')].every(img => img.complete && img.naturalWidth > 0));
          assert.equal(await sponsors.locator('a').count(), 6);
          assert.equal(await sponsors.evaluate(el => el.nextElementSibling.matches('.colophon')), true);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'sponsors cause horizontal overflow');
          for (const logo of await sponsors.locator('a').all()) {
            const box = await logo.boundingBox();
            assert.ok(box.height >= 44 && box.x >= 0 && box.x + box.width <= width, 'sponsor target leaves viewport');
          }
          const firstSponsor = sponsors.locator('a').first();
          const logoStyle = () => firstSponsor.locator('img').evaluate(img => {
            const style = getComputedStyle(img);
            return [style.filter, style.opacity, style.transitionDuration];
          });
          await page.mouse.move(0, 0);
          assert.deepEqual(await logoStyle(), [theme === 'dark' ? 'grayscale(1) invert(1)' : 'grayscale(1) contrast(1.05)', '0.68', '0s']);
          await sponsors.screenshot({ path: join(dir, `${name}-sponsors.png`) });
          await firstSponsor.hover();
          assert.deepEqual((await logoStyle()).slice(0, 2), ['none', '1']);
          await page.mouse.move(0, 0);
          await firstSponsor.focus();
          await page.keyboard.press(engine === 'webkit' ? 'Alt+Tab' : 'Tab');
          await page.keyboard.press(engine === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab');
          assert.equal(await firstSponsor.evaluate(el => el === document.activeElement), true);
          assert.deepEqual((await logoStyle()).slice(0, 2), ['none', '1']);
          assert.equal(await firstSponsor.evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
          await firstSponsor.evaluate(el => el.blur());
          await page.locator('.colophon').screenshot({ path: join(dir, `${name}-footer.png`) });
          assert.equal(await page.locator('.colophon-social a').count(), 5);
          for (const target of await page.locator('.site-nav button, .site-nav summary, .colophon a').all()) {
            if (await target.isVisible()) assert.ok((await target.boundingBox()).height >= 44, 'touch target under 44px');
          }
          await page.locator('.theme-toggle').click();
          const nextTheme = theme === 'light' ? 'dark' : 'light';
          assert.equal(await page.evaluate(() => localStorage.getItem('f1stories-theme')), nextTheme);
          await page.goto(dashboardUrl(server.url).replace('&theme=light', ''));
          assert.equal(await page.locator('html').getAttribute('data-theme'), nextTheme);
          assert.deepEqual(errors, []);
          console.log(`${engine}: ${width}px / ${theme} passed`);
        } finally { await context.close(); }
      }
    } finally { await browser.close(); }
  }
} finally { server.stop(); }
