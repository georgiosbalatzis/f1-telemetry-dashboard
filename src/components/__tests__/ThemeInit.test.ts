import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';

// Runs the real pre-paint script from index.html, so the shipped theme contract is what gets tested.
const NODE_FS = 'node:fs';
let script = '';
beforeAll(async () => {
  const { readFileSync } = await import(/* @vite-ignore */ NODE_FS);
  const html: string = readFileSync('index.html', 'utf8');
  script = html.match(/<script>([\s\S]*?)<\/script>/)![1];
});

const KEY = 'f1stories-theme';
const LEGACY = 'f1-telemetry-dashboard:theme';
const html = document.documentElement;
let store: Map<string, string>;
const localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
};

function boot({ osDark = false, search = '' } = {}) {
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-color-scheme: dark)' && osDark }));
  window.history.replaceState({}, '', `/${search}`);
  new Function(script)();
  return html.getAttribute('data-theme');
}

beforeEach(() => {
  store = new Map();
  html.removeAttribute('data-theme');
  document.head.innerHTML = '<meta name="theme-color" content="#f2eee4" />';
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it('applies a stored explicit choice over the OS preference', () => {
  localStorage.setItem(KEY, 'dark');
  expect(boot()).toBe('dark');
  expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#1b1a19');
  localStorage.setItem(KEY, 'light');
  expect(boot({ osDark: true })).toBe('light');
});

it('follows the OS when nothing is stored, without storing anything', () => {
  expect(boot({ osDark: true })).toBe('dark');
  expect(boot({ osDark: false })).toBe('light');
  expect(store.size).toBe(0);
});

it.each(['purple', 'auto', ''])('treats stored %j as "follow the OS" and leaves it untouched', (value) => {
  localStorage.setItem(KEY, value);
  expect(boot({ osDark: true })).toBe('dark');
  expect(localStorage.getItem(KEY)).toBe(value);
});

it.each(['dark', 'light'] as const)('migrates a legacy %s choice once, then drops the old key', (value) => {
  localStorage.setItem(LEGACY, value);
  expect(boot({ osDark: value === 'light' })).toBe(value);
  expect(localStorage.getItem(KEY)).toBe(value);
  expect(localStorage.getItem(LEGACY)).toBeNull();
});

it('keeps the canonical value when the legacy key disagrees', () => {
  localStorage.setItem(KEY, 'light');
  localStorage.setItem(LEGACY, 'dark');
  expect(boot({ osDark: true })).toBe('light');
  expect(localStorage.getItem(KEY)).toBe('light');
  expect(localStorage.getItem(LEGACY)).toBeNull();
});

it('drops an invalid legacy value without writing the canonical key', () => {
  localStorage.setItem(LEGACY, 'purple');
  expect(boot({ osDark: true })).toBe('dark');
  expect(localStorage.getItem(KEY)).toBeNull();
  expect(localStorage.getItem(LEGACY)).toBeNull();
});

it('lets ?theme= override for one view without touching storage', () => {
  localStorage.setItem(KEY, 'light');
  expect(boot({ search: '?theme=dark' })).toBe('dark');
  expect(localStorage.getItem(KEY)).toBe('light');
});

it('still paints when storage access throws', () => {
  vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError'); });
  expect(boot({ osDark: true })).toBe('dark');
});
