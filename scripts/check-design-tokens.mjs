// Offline guard for shared UI primitives only. Telemetry and domain inks are deliberately outside this contract.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('docs/design-tokens.json'));
const css = read('src/index.css').replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import[^;]+;/g, '');
const normalize = value => value.trim().replace(/\s+/g, ' ');
const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
function declarations(selector) {
  const matches = blocks.filter(match => normalize(match[1]) === selector);
  assert.ok(matches.length, `Missing token scope: ${selector}`);
  return Object.fromEntries(matches.flatMap(match => [...match[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)]
    .map(([, key, value]) => [key, normalize(value)])));
}
function resolve(key, tokens, seen = []) {
  assert.ok(Object.hasOwn(tokens, key), `Missing token: ${key}`);
  assert.ok(!seen.includes(key), `Circular alias: ${[...seen, key].join(' -> ')}`);
  return tokens[key].replace(/var\((--[\w-]+)\)/g, (_, alias) => resolve(alias, tokens, [...seen, key]));
}

assert.equal(manifest.source, 'styles/editorial.css', 'Main-site CSS remains authoritative');
const light = declarations(':root');
const dark = { ...light, ...declarations(':root[data-theme="dark"]') };
for (const [theme, tokens] of Object.entries({ light, dark })) {
  for (const [key, value] of Object.entries(manifest.themes[theme])) {
    assert.equal(resolve(key, tokens), value, `${theme}: ${key}`);
  }
  for (const [alias, canonical] of Object.entries(manifest.aliases)) {
    assert.equal(resolve(alias, tokens), manifest.themes[theme][canonical], `${theme} alias: ${alias}`);
  }
  for (const [key, value] of Object.entries(manifest.fixedInversion)) {
    assert.equal(resolve(key, tokens), value, `${theme} fixed surface: ${key}`);
  }
}
// The existing fixed-dark technical panels use the dark UI edition even on a light page.
const technical = { ...light, ...declarations('.gap-card, .track-panel') };
for (const [local, canonical] of Object.entries({
  '--surface': '--bg-surface', '--line': '--border', '--text': '--text-primary',
  '--text-strong': '--text-primary', '--text-muted': '--text-secondary', '--text-dim': '--text-secondary',
  '--accent': '--accent', '--focus': '--accent',
})) assert.equal(resolve(local, technical), manifest.themes.dark[canonical], `Fixed-dark panel: ${local}`);
console.log('Telemetry UI tokens synchronized: canonical light/dark, semantic aliases and fixed editions.');
