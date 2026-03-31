# F1 Telemetry Dashboard

React + TypeScript + Vite app for exploring OpenF1 race telemetry, lap data, weather, radio, and race-control events.

## Local development

- Use Node.js 20.
- Install dependencies with `npm ci`.
- Start the dev server with `npm run dev`.

## Validation

- `npm run lint` fails on warnings.
- `npm run typecheck` runs the TypeScript project build without emitting a production bundle.
- `npm run build` runs typecheck and then the Vite production build.
- `npm run ci` is the local equivalent of the GitHub Actions validation path.
- `bash check.sh` runs the structural checks and then `npm run ci`.

## Deployment

- Production deploys are triggered by pushes to `main` or manual runs of [`.github/workflows/deploy.yml`](/Users/giorgos/WebstormProjects/f1-telemetry-dashboard/.github/workflows/deploy.yml).
- GitHub Actions builds the site with `npm ci` and `npm run ci`, then uploads `dist/` as the Pages artifact.
- `vite.config.ts` is configured with the `/f1-telemetry-dashboard/` base path required for GitHub Pages.

## Branch discipline

- `main` is the source branch. Do not commit generated `dist/`, `build/`, or root-level `assets/` output to it.
- `gh-pages` is deploy output only. Do not merge `gh-pages` back into `main`.
- Open pull requests into `main`; CI in [`.github/workflows/ci.yml`](/Users/giorgos/WebstormProjects/f1-telemetry-dashboard/.github/workflows/ci.yml) must stay green before merge.

## Repo cleanup notes

- The repo previously mixed GitHub Pages output into `main`. Phase 1 restores the app source tree and moves validation/deploy responsibilities back into GitHub Actions.
