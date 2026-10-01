/**
 * DashboardContainer — owns all UI state, side-effects, and event handlers.
 *
 * Calls useDashboard() for data, manages local UI concerns (theme, split-mode,
 * presets, feedback toasts), derives display values, then renders DashboardShell
 * with a clean props surface.
 *
 * Nothing in this file does API fetching or chart-data computation — those live
 * in useDashboard / useDashboardViewModel.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import type { DashboardFilterSnapshot } from '../hooks/useDashboardFilters';
import { COLORS, chartColorForTheme } from '../constants/colors';
import { DriverProvider } from '../contexts/DriverContext';
import { DashboardShell } from './DashboardShell';
import { TAB_LABELS } from './dashboard/tabLabels';
import { copy } from '../copy';
import type { Tab } from './dashboard/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ThemeMode = 'dark' | 'light';

type SavedPreset = {
  name: string;
  snapshot: DashboardFilterSnapshot;
  splitMode: boolean;
  themeMode?: ThemeMode;
  savedAt: string;
};

// ─── Storage keys ─────────────────────────────────────────────────────────────

const PRESET_STORAGE_KEY = 'f1-telemetry-dashboard:presets';
const THEME_STORAGE_KEY  = 'f1stories-theme'; // same key as f1stories.gr (theme-init.js)
const LEGACY_THEME_STORAGE_KEY = 'f1-telemetry-dashboard:theme';

// ─── One-time readers (called as useState initialisers) ───────────────────────

function readInitialSplitMode() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('layout') === 'split';
}

function readInitialEmbedMode() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('embed') === '1';
}

function normalizeThemeMode(value: string | null | undefined): ThemeMode | null {
  if (value === 'light' || value === 'dark') return value;
  return null;
}

function readInitialThemeMode(): ThemeMode {
  // Same order as the inline script in index.html: ?theme=, stored choice, OS preference, light paper.
  if (typeof window === 'undefined') return 'light';
  const fromQuery = normalizeThemeMode(new URLSearchParams(window.location.search).get('theme'));
  if (fromQuery) return fromQuery;
  try {
    const fromStorage = normalizeThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY));
    if (fromStorage) return fromStorage;
  } catch { /* storage unavailable */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readSavedPresets(): Record<string, SavedPreset> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SavedPreset>) ?? {} : {};
  } catch { return {}; }
}

// ─── URL builders ─────────────────────────────────────────────────────────────

function buildDashboardUrl(
  snapshot: DashboardFilterSnapshot,
  splitMode: boolean,
  embedMode = false,
  themeMode: ThemeMode = 'light',
  anchorId?: string,
) {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams();
  params.set('year', String(snapshot.year));
  if (snapshot.circuit) params.set('circuit', snapshot.circuit);
  if (snapshot.sessionKey != null) params.set('session', String(snapshot.sessionKey));
  if (snapshot.driverNums.length > 0) params.set('drivers', snapshot.driverNums.join(','));
  params.set('lap', String(snapshot.lapNum));
  params.set('tab', snapshot.tab);
  if (splitMode) params.set('layout', 'split');
  if (embedMode) params.set('embed', '1');
  params.set('theme', themeMode);
  const query = params.toString();
  const hash  = anchorId ? `#${anchorId}` : window.location.hash;
  return `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ''}${hash}`;
}

function buildIframeSnippet(
  snapshot: DashboardFilterSnapshot,
  splitMode: boolean,
  themeMode: ThemeMode,
  anchorId?: string,
  iframeHeight = 920,
) {
  const src        = buildDashboardUrl(snapshot, splitMode, true, themeMode, anchorId);
  const background = themeMode === 'light' ? COLORS.fallback.iframeLight : COLORS.fallback.iframeDark;
  return [
    `<iframe`,
    `  src="${src}"`,
    `  title="f1stories.gr F1 Telemetry Dashboard"`,
    `  width="100%"`,
    `  height="${iframeHeight}"`,
    `  loading="lazy"`,
    `  style="border:0; width:100%; max-width:100%; background:${background};"`,
    `></iframe>`,
  ].join('\n');
}

// ─── Clipboard helpers ────────────────────────────────────────────────────────

function getClipboardErrorMessage(error: unknown, label: string) {
  const isDomEx = typeof DOMException !== 'undefined' && error instanceof DOMException;
  if (isDomEx && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
    return `${label} clipboard denied; copy manually`;
  }
  return `${label} could not be copied; copy manually`;
}

/** Writes to the clipboard. `error` is the message to show if the caller falls back (null when the API is simply absent). */
async function tryClipboard(text: string, label: string): Promise<{ copied: boolean; error: string | null }> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { copied: true, error: null };
    }
  } catch (err) {
    return { copied: false, error: getClipboardErrorMessage(err, label) };
  }
  return { copied: false, error: null };
}

function isShareCancel(error: unknown) {
  return typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardContainer() {
  const data = useDashboard();
  const { filters, selectionData } = data;

  // ── Local UI state ─────────────────────────────────────────────────────
  const [splitMode,    setSplitMode]    = useState(readInitialSplitMode);
  const [embedMode]                     = useState(readInitialEmbedMode);
  const [themeMode,    setThemeMode]    = useState<ThemeMode>(readInitialThemeMode);
  const [presetName,   setPresetName]   = useState('');
  const [feedback,     setFeedback]     = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<Record<string, SavedPreset>>(readSavedPresets);

  // ── Derived layout classes ─────────────────────────────────────────────
  const contentLayoutClass = splitMode ? 'analysis-content analysis-split' : 'analysis-content';

  const pageShellClass = embedMode
    ? 'page-shell page-shell-embed'
    : 'page-shell';

  // ── Computed display values ────────────────────────────────────────────
  const tabBoundaryResetKey = `${filters.tab}:${filters.sessionKey ?? 'none'}:${filters.lapNum}:${filters.driverNums.join(',')}`;

  const sessionLabel = useMemo(
    () =>
      selectionData.sessionOptions.find((opt) => opt.v === filters.sessionKey)?.l ??
      (filters.sessionKey != null ? `Session ${filters.sessionKey}` : 'Session'),
    [filters.sessionKey, selectionData.sessionOptions],
  );

  const defaultPresetName = useMemo(
    () => `${(filters.circuit || 'session').toLowerCase().replace(/\s+/g, '-')}-lap-${filters.lapNum}`,
    [filters.circuit, filters.lapNum],
  );

  const presetNames = useMemo(
    () =>
      Object.values(savedPresets)
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
        .map((p) => p.name),
    [savedPresets],
  );

  const embedTitle = useMemo(() => {
    const parts = [filters.circuit, sessionLabel].filter(Boolean);
    return parts.length > 0 ? parts.join(' · ') : 'F1 Telemetry Embed';
  }, [filters.circuit, sessionLabel]);

  const openDashboardUrl = useMemo(
    () => buildDashboardUrl(filters.snapshot, splitMode, false, themeMode),
    [filters.snapshot, splitMode, themeMode],
  );

  // ── Side effects ───────────────────────────────────────────────────────

  // Sync URL on any filter/layout/theme change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = buildDashboardUrl(filters.snapshot, splitMode, embedMode, themeMode);
    if (url === window.location.href) return;
    // Safari throws SecurityError past ~100 calls per 10 s; the next real change writes the URL again.
    try { window.history.replaceState({}, '', url); } catch { /* rate limited */ }
  }, [embedMode, filters.snapshot, splitMode, themeMode]);

  // Smooth-scroll to hash fragment on tab change
  useEffect(() => {
    if (typeof window === 'undefined' || embedMode) return;
    const targetId = window.location.hash.replace(/^#/, '');
    if (!targetId) return;
    let attempts = 0;
    const timerId = window.setInterval(() => {
      const target = window.document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        window.clearInterval(timerId);
        return;
      }
      attempts += 1;
      if (attempts >= 12) window.clearInterval(timerId);
    }, 120);
    return () => window.clearInterval(timerId);
  }, [embedMode, filters.tab]);

  // Persist presets to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(savedPresets)); }
    catch { /* storage unavailable */ }
  }, [savedPresets]);

  // Auto-dismiss feedback toast after 2.6 s
  useEffect(() => {
    if (!feedback || typeof window === 'undefined') return;
    const id = window.setTimeout(() => setFeedback(null), 2600);
    return () => window.clearTimeout(id);
  }, [feedback]);

  // Apply theme attribute + meta theme-color
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.setAttribute('data-theme', themeMode);
    const themeColor = themeMode === 'light' ? COLORS.fallback.iframeLight : COLORS.fallback.iframeDark;
    window.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
  }, [themeMode]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handlePresetNameChange = useCallback((value: string) => {
    setPresetName(value);
    const preset = savedPresets[value];
    if (!preset) return;
    filters.applySnapshot(preset.snapshot);
    setSplitMode(preset.splitMode);
    if (preset.themeMode) setThemeMode(preset.themeMode);
    setFeedback(copy.masthead.presetLoaded(preset.name));
  }, [filters, savedPresets]);

  const handleSavePreset = useCallback(() => {
    const name = presetName.trim() || defaultPresetName;
    const preset: SavedPreset = {
      name,
      snapshot:  filters.snapshot,
      splitMode,
      themeMode,
      savedAt:   new Date().toISOString(),
    };
    setSavedPresets((prev) => ({ ...prev, [name]: preset }));
    setPresetName(name);
    setFeedback(copy.masthead.presetSaved(name));
  }, [defaultPresetName, filters.snapshot, presetName, splitMode, themeMode]);

  const shareSnapshot = useCallback(async (snapshot: DashboardFilterSnapshot, label: string) => {
    const url = buildDashboardUrl(snapshot, splitMode, embedMode, themeMode);
    const clipboard = await tryClipboard(url, label);
    if (clipboard.copied) { setFeedback(`${label} copied`); return; }
    let failure = clipboard.error;
    try {
      if (navigator.share) {
        await navigator.share({ title: `f1stories.gr ${TAB_LABELS[snapshot.tab]} view`, url });
        setFeedback(`${label} shared`);
        return;
      }
    } catch (err) {
      if (!isShareCancel(err)) failure = failure ?? `${label} could not be shared; copy manually`;
    }
    window.prompt('Copy this link', url);
    setFeedback(failure ?? `${label} ready`);
  }, [embedMode, splitMode, themeMode]);

  /** Copies an iframe snippet, or shows it in a prompt when the clipboard is unavailable or refused. */
  const copySnippet = useCallback(async (snippet: string, label: string) => {
    const { copied, error } = await tryClipboard(snippet, label);
    if (copied) { setFeedback(`${label} copied`); return; }
    window.prompt('Copy this iframe snippet', snippet);
    setFeedback(error ?? `${label} ready`);
  }, []);

  const embedSnapshot = useCallback(
    (snapshot: DashboardFilterSnapshot, label: string) => copySnippet(buildIframeSnippet(snapshot, splitMode, themeMode), label),
    [copySnippet, splitMode, themeMode],
  );

  const handleShareTab = useCallback(async (tab: Tab) => shareSnapshot({ ...filters.snapshot, tab }, `${TAB_LABELS[tab]} link`), [filters.snapshot, shareSnapshot]);
  const handleEmbedTab = useCallback(async (tab: Tab) => embedSnapshot({ ...filters.snapshot, tab }, `${TAB_LABELS[tab]} embed`), [embedSnapshot, filters.snapshot]);

  const handleEmbedPanel = useCallback(
    (panelId: string) => copySnippet(buildIframeSnippet(filters.snapshot, false, themeMode, panelId, 720), 'Panel embed'),
    [copySnippet, filters.snapshot, themeMode],
  );

  const handlePrint       = useCallback(() => { setFeedback(copy.masthead.printing); window.print(); }, []);
  const handleToggleSplit = useCallback(() => { setSplitMode((p) => !p); setFeedback(splitMode ? copy.masthead.splitDisabled : copy.masthead.splitEnabled); }, [splitMode]);
  const handleToggleTheme = useCallback(() => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    try { window.localStorage.setItem(THEME_STORAGE_KEY, next); } // only an explicit choice is stored, so the OS preference keeps applying until then
    catch { /* storage unavailable */ }
  }, [themeMode]);
  const handleBack        = useCallback(() => { if (window.history.length > 1) { window.history.back(); } else { setFeedback(copy.masthead.noHistory); } }, []);

  // ── Driver colours (shared with all tab components via DriverProvider) ─
  // Chart traces use theme-adjusted team colours; markers elsewhere keep the raw colour.
  // The adjustment loops over contrast steps, so each driver is computed once per theme.
  const teamDriverColor = data.viewModel.driverColor;
  const driverColor = useMemo(() => {
    const cache = new Map<number, string>();
    return (driverNumber: number) => {
      let color = cache.get(driverNumber);
      if (color === undefined) cache.set(driverNumber, color = chartColorForTheme(teamDriverColor(driverNumber), themeMode));
      return color;
    };
  }, [teamDriverColor, themeMode]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <DriverProvider driverNums={data.filters.driverNums} driverMap={data.selectionData.driverMap} driverColor={driverColor}>
    <DashboardShell
      data={data}
      splitMode={splitMode}
      embedMode={embedMode}
      themeMode={themeMode}
      presetName={presetName}
      presetNames={presetNames}
      feedback={feedback}
      embedTitle={embedTitle}
      openDashboardUrl={openDashboardUrl}
      contentLayoutClass={contentLayoutClass}
      pageShellClass={pageShellClass}
      tabBoundaryResetKey={tabBoundaryResetKey}
      onPresetNameChange={handlePresetNameChange}
      onSavePreset={handleSavePreset}
      onShareTab={handleShareTab}
      onEmbedTab={handleEmbedTab}
      onEmbedPanel={handleEmbedPanel}
      onPrint={handlePrint}
      onToggleSplit={handleToggleSplit}
      onToggleTheme={handleToggleTheme}
      onBack={handleBack}
    />
    </DriverProvider>
  );
}
