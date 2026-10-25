# F1 Telemetry Dashboard

React + TypeScript + Vite app for exploring OpenF1 race telemetry, lap data, weather, radio, and race-control events.

## Local development

- Use Node.js 20.
- Install dependencies with `npm ci`.
- Start the dev server with `npm run dev`.

## Supported browsers

Safari / iOS / iPadOS 16.4+, Chrome and Edge 111+, Firefox 128+ (phones, tablets and desktops). This is Tailwind CSS v4's own floor; the styles also use `color-mix()`, `:has()` and `aspect-ratio`. `vite.config.ts` builds for exactly these targets.

## Validation

- `npm run lint` fails on warnings.
- `npm run typecheck` runs the TypeScript project build without emitting a production bundle.
- `npm run build` runs typecheck and then the Vite production build.
- `npm run ci` is the local equivalent of the GitHub Actions validation path.

## Deployment

- Production deploys are triggered by pushes to `main` or manual runs of [`.github/workflows/deploy.yml`](/Users/giorgos/WebstormProjects/f1-telemetry-dashboard/.github/workflows/deploy.yml).
- GitHub Actions builds the site with `npm ci` and `npm run ci`, then uploads `dist/` as the Pages artifact.
- The build includes the frozen Singapore 2026 Q3 figures, Greek report and datasets at `analysis/hamilton-singapore-2026/`.
- `vite.config.ts` is configured with the `/f1-telemetry-dashboard/` base path required for GitHub Pages.

## Moved to f1-stories.gr

The dashboard is published at `https://f1-stories.gr/telemetry/`. [`pages-mode.json`](pages-mode.json) decides what
`deploy.yml` publishes at `georgiosbalatzis.github.io/f1-telemetry-dashboard/`:

- `"app"` (current): the app, as before.
- `"legacy-redirects"`: `npm run build:legacy-redirects` builds the f1-stories.gr version, then
  [`scripts/legacy-redirects.mjs`](scripts/legacy-redirects.mjs) replaces each of its pages with one that sends readers
  to the same page on f1-stories.gr with the query string and hash, and links it as canonical (noindex where the
  f1-stories.gr page is noindex). Figures, datasets and other files stay at their old URLs. Any other old path is handled
  by `404.html`: the same page when it exists (any case, with or without the trailing slash), otherwise the landing page.

GitHub Pages cannot send HTTP 301s; these are client-side redirects. Without JavaScript a meta refresh goes to the same
page without the query and hash, and the page shows the link.

Publishing (repository owner):

1. **Settings → Pages → Source: GitHub Actions**, and stop publishing to `gh-pages`. Today the source is the `gh-pages`
   branch, which is also pushed by hand; any later push there or deploy from it would replace the compatibility pages.
2. Check that `https://f1-stories.gr/telemetry/` is live and its scheduled refresh is healthy (f1StoriesPage).
3. Set `"mode": "legacy-redirects"` in a reviewed PR; merging it runs `deploy.yml`.

Rollback: set `"mode": "app"` and merge; the next deploy publishes the app again. Roll this back **before** rolling
f1-stories.gr back to a release without the tools: that release's `/telemetry/` pages point to github.io, and with the
redirects live here readers would be sent back and forth.

## Branch discipline

- `main` is the source branch. Do not commit generated `dist/`, `build/`, or root-level `assets/` output to it.
- `gh-pages` is deploy output only. Do not merge `gh-pages` back into `main`.
- Open pull requests into `main`; CI in [`.github/workflows/ci.yml`](/Users/giorgos/WebstormProjects/f1-telemetry-dashboard/.github/workflows/ci.yml) must stay green before merge.

## Repo cleanup notes

- The repo previously mixed GitHub Pages output into `main`. Phase 1 restores the app source tree and moves validation/deploy responsibilities back into GitHub Actions.
