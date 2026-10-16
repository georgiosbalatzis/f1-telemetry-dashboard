import { cpSync, mkdirSync } from 'node:fs';

const source = new URL('../analysis/hamilton-singapore-2026/', import.meta.url);
const destination = new URL('../dist/analysis/hamilton-singapore-2026/', import.meta.url);
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
console.log('Included Singapore Q3 figures, report and datasets in the Pages build.');
