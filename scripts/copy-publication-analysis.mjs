import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const source = new URL('../analysis/hamilton-singapore-2026/', import.meta.url);
const destination = new URL('../dist/analysis/hamilton-singapore-2026/', import.meta.url);
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
// Same canonical rule as vite.config.ts: f1-stories.gr for build:f1stories, the github.io page otherwise.
const origin = process.env.VITE_F1STORIES_BUILD === 'true' ? 'https://f1-stories.gr' : 'https://georgiosbalatzis.github.io';
const page = new URL('index.html', destination);
const canonical = `${origin}${process.env.APP_BASE || '/f1-telemetry-dashboard/'}analysis/hamilton-singapore-2026/`;
writeFileSync(page, readFileSync(page, 'utf8').replace('<title>', `<link rel="canonical" href="${canonical}"><title>`));
console.log('Included Singapore Q3 figures, report and datasets in the Pages build.');
