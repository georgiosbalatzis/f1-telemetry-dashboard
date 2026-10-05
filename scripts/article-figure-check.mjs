#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chromium, firefox, webkit } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const articleRoot = path.resolve(process.argv.find((arg) => arg.startsWith('--article-root='))?.split('=')[1] ?? path.join(root, '../f1StoriesPage'));
const bundlePath = path.resolve(process.argv.find((arg) => arg.startsWith('--bundle='))?.split('=')[1] ?? '/tmp/baku-editorial-preview.f1embed.json');
const outputDir = path.resolve(process.argv.find((arg) => arg.startsWith('--output='))?.split('=')[1] ?? path.join(root, 'docs/embeds/article-release-a'));
const publicRoot = path.resolve(process.argv.find((arg) => arg.startsWith('--public-root='))?.split('=')[1] ?? path.join(articleRoot, 'dist'));
const articleRequire = createRequire(path.join(articleRoot, 'package.json'));
const { renderTelemetryFigure } = articleRequire(path.join(articleRoot, 'blog-module/build/telemetry-figure.js'));
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'article-figure-check-'));
const marker = 'release-a-preview.f1embed.json';
fs.mkdirSync(work, { recursive: true });
fs.copyFileSync(bundlePath, path.join(work, marker));
let figure = renderTelemetryFigure(marker, work);
const assets = fs.readdirSync(path.join(work, 'embeds'));
for (const asset of assets) {
  const base = `/blog-module/blog-entries/${encodeURIComponent(path.basename(work))}/embeds/${asset}`;
  figure = figure.split(base).join(`/assets/${asset}`);
}
const editorialCssPath = path.join(publicRoot, 'styles/editorial.min.css');
const articleCssPath = path.join(publicRoot, 'blog-module/blog/article-editorial.min.css');
const editorialTokens = fs.readFileSync(fs.existsSync(editorialCssPath) ? editorialCssPath : path.join(articleRoot, 'styles/editorial.css'), 'utf8');
const articleCss = fs.readFileSync(fs.existsSync(articleCssPath) ? articleCssPath : path.join(articleRoot, 'blog-module/blog/article-editorial.css'), 'utf8');
const html = `<!doctype html><html lang="el" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${editorialTokens}\n${articleCss}</style></head><body class="editorial-page article-page"><main class="article-page-wrapper"><article class="article-container" data-article-kind="teams"><div class="article-body-grid"><div class="article-main-column"><div class="article-content"><p>Σταθερό κείμενο πριν από το σχήμα.</p>${figure}<p>Σταθερό κείμενο μετά το σχήμα.</p>${figure}</div></div></div></article></main></body></html>`;
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname.startsWith('/assets/')) {
    const name = path.basename(decodeURIComponent(pathname.slice('/assets/'.length)));
    if (!assets.includes(name)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=3600' });
    res.end(fs.readFileSync(path.join(work, 'embeds', name)));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(html);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const url = `http://127.0.0.1:${address.port}/article.html?story=preview#figure`;
const results = { bundle: path.basename(bundlePath), scope: JSON.parse(fs.readFileSync(bundlePath, 'utf8')).scope, styles: [editorialCssPath, articleCssPath].map((file) => fs.existsSync(file) ? path.relative(publicRoot, file) : path.relative(articleRoot, file.replace(/\.min\.css$/, '.css'))), browsers: {}, externalRequests: [], images: assets.map((name) => ({ name, bytes: fs.statSync(path.join(work, 'embeds', name)).size })) };
fs.mkdirSync(outputDir, { recursive: true });

try {
  for (const [name, launcher] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await launcher.launch({ headless: true });
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.on('request', (request) => { if (!request.url().startsWith(`http://127.0.0.1:${address.port}/`) && !request.url().startsWith('data:')) results.externalRequests.push(request.url()); });
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      await page.goto(url, { waitUntil: 'load' });
      const viewports = [];
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const theme of ['light', 'dark']) {
          await page.evaluate((mode) => mode === 'light' ? document.documentElement.setAttribute('data-theme', 'light') : document.documentElement.removeAttribute('data-theme'), theme);
          const state = await page.evaluate(() => {
            const figure = document.querySelector('.f1-telemetry-figure');
            const light = figure.querySelector('.f1-telemetry-picture--light');
            const dark = figure.querySelector('.f1-telemetry-picture--dark');
            const active = getComputedStyle(light).display !== 'none' ? light : dark;
            const image = active.querySelector('img');
            const content = document.querySelector('.article-content');
            return { viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, articleWidth: content.getBoundingClientRect().width, imageWidth: image.getBoundingClientRect().width, imageHeight: image.getBoundingClientRect().height, naturalWidth: image.naturalWidth, theme: active.classList.contains('f1-telemetry-picture--light') ? 'light' : 'dark', pictureCount: figure.querySelectorAll('picture').length, analysisHref: figure.querySelector('.f1-telemetry-analysis a').href, source: figure.querySelector('.f1-telemetry-source').textContent, caption: figure.querySelector('figcaption').textContent };
          });
          if (state.scrollWidth > width) throw new Error(`${name} ${width}px ${theme}: horizontal overflow ${state.scrollWidth}px`);
          if (state.theme !== theme || state.pictureCount !== 2 || state.imageWidth > state.articleWidth + 1 || state.naturalWidth < 300 || !state.analysisHref.startsWith('https://')) throw new Error(`${name} ${width}px ${theme}: image or theme mismatch ${JSON.stringify(state)}`);
          if (name === 'chromium') await page.locator('.f1-telemetry-figure').first().screenshot({ path: path.join(outputDir, `${width}-${theme}.png`) });
          viewports.push(state);
        }
      }
      const stableUrl = page.url();
      await page.evaluate(() => localStorage.setItem('f1stories-theme', 'sentinel'));
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      if (page.url() !== stableUrl || await page.evaluate(() => localStorage.getItem('f1stories-theme')) !== 'sentinel') throw new Error(`${name}: figure host changed article URL or theme storage`);
      await page.emulateMedia({ media: 'print' });
      const print = await page.evaluate(() => {
        const figure = document.querySelector('.f1-telemetry-figure');
        return { light: getComputedStyle(figure.querySelector('.f1-telemetry-picture--light')).display, dark: getComputedStyle(figure.querySelector('.f1-telemetry-picture--dark')).display, title: figure.querySelector('h3').textContent, caption: figure.querySelector('figcaption').textContent, source: figure.querySelector('.f1-telemetry-source').textContent, href: figure.querySelector('.f1-telemetry-analysis a').href, scrollWidth: document.documentElement.scrollWidth };
      });
      if (print.light === 'none' || print.dark !== 'none' || !print.caption || !print.source || !print.href.includes('https://')) throw new Error(`${name}: light print figure/source/caption/link not present`);
      results.browsers[name] = { viewports, print, pageErrors, javascriptDisabled: 'pending' };
      await context.close();
      const noJs = await browser.newContext({ javaScriptEnabled: false });
      const noJsPage = await noJs.newPage();
      await noJsPage.goto(url, { waitUntil: 'load' });
      const staticFigure = await noJsPage.locator('.f1-telemetry-figure').count();
      if (staticFigure !== 2) throw new Error(`${name}: figures missing with JavaScript disabled`);
      results.browsers[name].javascriptDisabled = { figures: staticFigure, imagesLoaded: await noJsPage.locator('.f1-telemetry-image').evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth > 0).length) };
      await noJs.close();
      await browser.close();
    } catch (error) {
      await browser.close();
      throw error;
    }
  }
  if (results.externalRequests.length) throw new Error(`unexpected external requests: ${results.externalRequests.join(', ')}`);
  fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify({ outputDir, browsers: Object.keys(results.browsers), externalRequests: results.externalRequests.length, images: results.images }));
} finally {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(work, { recursive: true, force: true });
}
