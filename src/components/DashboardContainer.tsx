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
import { COLORS } from '../constants/colors';
import { DriverProvider } from '../contexts/DriverContext';
import { DashboardShell } from './DashboardShell';
import { TAB_LABELS } from './dashboard/tabLabels';
import type { QuickChip, SummaryPill } from './DashboardShell';
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
const THEME_STORAGE_KEY  = 'f1-telemetry-dashboard:theme';

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
  if (typeof window === 'undefined') return 'dark';
  const fromQuery = normalizeThemeMode(new URLSearchParams(window.location.search).get('theme'));
  if (fromQuery) return fromQuery;
  try {
    const fromStorage = normalizeThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
    if (fromStorage) return fromStorage;
  } catch { /* storage unavailable */ }
  return 'dark';
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
  themeMode: ThemeMode = 'dark',
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
  if (themeMode === 'light') params.set('theme', 'light');
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

function isShareCancel(error: unknown) {
  return typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardContainer() {
  const data = useDashboard();
  const { filters, viewModel, selectionData, pits } = data;

  // ── Local UI state ─────────────────────────────────────────────────────
  const [splitMode,    setSplitMode]    = useState(readInitialSplitMode);
  const [embedMode]                     = useState(readInitialEmbedMode);
  const [themeMode,    setThemeMode]    = useState<ThemeMode>(readInitialThemeMode);
  const [presetName,   setPresetName]   = useState('');
  const [feedback,     setFeedback]     = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<Record<string, SavedPreset>>(readSavedPresets);

  // ── Derived layout classes ─────────────────────────────────────────────
  const contentLayoutClass = splitMode
    ? `grid ${embedMode ? 'gap-5 pb-8' : 'gap-4 pb-12 sm:gap-5 sm:pb-16'} xl:grid-cols-2 xl:[&>*:first-child]:col-span-2`
    : `${embedMode ? 'space-y-5 pb-8' : 'space-y-4 pb-12 sm:space-y-5 sm:pb-16'}`;

  const pageShellClass = embedMode
    ? 'relative mx-auto max-w-[1320px] px-3 py-3 sm:px-4 sm:py-4'
    : 'relative mx-auto max-w-[1440px] px-4 py-3 sm:px-6 sm:py-4';

  // ── Computed display values ────────────────────────────────────────────
  const tabBoundaryResetKey = `${filters.tab}:${filters.sessionKey ?? 'none'}:${filters.lapNum}:${filters.driverNums.join(',')}`;

  const summaryPills = useMemo<SummaryPill[]>(() => {
    return viewModel.lapSummaries.slice(0, 2).map((summary, index) => ({
      label:  `P${index + 1}`,
      driver: summary.name,
      detail:
        summary.gapToLeader != null && summary.gapToLeader > 0
          ? `+${summary.gapToLeader.toFixed(3)}s`
          : summary.lapTime != null
          ? `${summary.lapTime.toFixed(3)}s`
          : '—',
      tone: index === 0 ? 'blue' as const : 'purple' as const,
    }));
  }, [viewModel.lapSummaries]);

  const quickChips = useMemo<QuickChip[]>(() => {
    const leader   = viewModel.lapSummaries[0];
    const pitLabel = filters.tab === 'tires'
      ? pits.loading ? 'Pits …' : `Pits ${viewModel.filteredPits.length}`
      : 'Pits —';
    return [
      { label: leader?.lapTime ? `Fastest ${leader.name} ${leader.lapTime.toFixed(3)}s` : `Focus L${filters.lapNum}`, tone: 'purple' as const },
      { label: pitLabel,                                  tone: 'amber'   as const },
      { label: `Drivers ${filters.driverNums.length}`,   tone: 'blue'    as const },
      { label: `Laps ${selectionData.lapOptions.length}`, tone: 'neutral' as const },
    ];
  }, [filters.driverNums.length, filters.lapNum, filters.tab, pits.loading, selectionData.lapOptions.length, viewModel.filteredPits.length, viewModel.lapSummaries]);

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

  const embedSubtitle = useMemo(
    () => `${filters.year} season · ${TAB_LABELS[filters.tab]} view`,
    [filters.tab, filters.year],
  );

  const embedContext = useMemo(
    () => [
      { label: 'Lap',     value: `L${filters.lapNum}` },
      { label: 'Drivers', value: `${filters.driverNums.length}/4` },
      { label: 'View',    value: TAB_LABELS[filters.tab] },
    ],
    [filters.driverNums.length, filters.lapNum, filters.tab],
  );

  const openDashboardUrl = useMemo(
    () => buildDashboardUrl(filters.snapshot, splitMode, false, themeMode),
    [filters.snapshot, splitMode, themeMode],
  );

  // ── Side effects ───────────────────────────────────────────────────────

  // Sync URL on any filter/layout/theme change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.history.replaceState(
      {},
      '',
      buildDashboardUrl(filters.snapshot, splitMode, embedMode, themeMode),
    );
  }, [embedMode, filters.snapshot, splitMode, themeMode]);

  // Smooth-scroll to hash fragment on tab change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetId = window.location.hash.replace(/^#/, '');
    if (!targetId) return;
    let attempts = 0;
    const timerId = window.setInterval(() => {
      const target = window.document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.clearInterval(timerId);
        return;
      }
      attempts += 1;
      if (attempts >= 12) window.clearInterval(timerId);
    }, 120);
    return () => window.clearInterval(timerId);
  }, [filters.tab]);

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

  // Apply theme class + meta theme-color
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.classList.toggle('theme-light', themeMode === 'light');
    root.classList.toggle('theme-dark',  themeMode === 'dark');
    const themeColor = themeMode === 'light' ? COLORS.fallback.iframeLight : COLORS.fallback.iframeDark;
    window.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    try { window.localStorage.setItem(THEME_STORAGE_KEY, themeMode); }
    catch { /* storage unavailable */ }
  }, [themeMode]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handlePresetNameChange = useCallback((value: string) => {
    setPresetName(value);
    const preset = savedPresets[value];
    if (!preset) return;
    filters.applySnapshot(preset.snapshot);
    setSplitMode(preset.splitMode);
    if (preset.themeMode) setThemeMode(preset.themeMode);
    setFeedback(`Loaded preset ${preset.name}`);
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
    setFeedback(`Saved preset ${name}`);
  }, [defaultPresetName, filters.snapshot, presetName, splitMode, themeMode]);

  const shareSnapshot = useCallback(async (snapshot: DashboardFilterSnapshot, label: string) => {
    const url = buildDashboardUrl(snapshot, splitMode, embedMode, themeMode);
    let clipboardError: string | null = null;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setFeedback(`${label} copied`);
        return;
      }
    } catch (err) { clipboardError = getClipboardErrorMessage(err, label); }
    try {
      if (navigator.share) {
        await navigator.share({ title: `f1stories.gr ${TAB_LABELS[snapshot.tab]} view`, url });
        setFeedback(`${label} shared`);
        return;
      }
    } catch (err) {
      if (!isShareCancel(err)) {
        clipboardError = clipboardError ?? `${label} could not be shared; copy manually`;
      }
    }
    window.prompt('Copy this link', url);
    setFeedback(clipboardError ?? `${label} ready`);
  }, [embedMode, splitMode, themeMode]);

  const embedSnapshot = useCallback(async (snapshot: DashboardFilterSnapshot, label: string) => {
    const snippet = buildIframeSnippet(snapshot, splitMode, themeMode);
    let clipboardError: string | null = null;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
        setFeedback(`${label} copied`);
        return;
      }
    } catch (err) { clipboardError = getClipboardErrorMessage(err, label); }
    window.prompt('Copy this iframe snippet', snippet);
    setFeedback(clipboardError ?? `${label} ready`);
  }, [splitMode, themeMode]);

  const handleShare    = useCallback(async () => shareSnapshot(filters.snapshot, 'Share link'), [filters.snapshot, shareSnapshot]);
  const handleShareTab = useCallback(async (tab: Tab) => shareSnapshot({ ...filters.snapshot, tab }, `${TAB_LABELS[tab]} link`), [filters.snapshot, shareSnapshot]);
  const handleEmbed    = useCallback(async () => embedSnapshot(filters.snapshot, 'Embed code'), [embedSnapshot, filters.snapshot]);
  const handleEmbedTab = useCallback(async (tab: Tab) => embedSnapshot({ ...filters.snapshot, tab }, `${TAB_LABELS[tab]} embed`), [embedSnapshot, filters.snapshot]);

  const handleEmbedPanel = useCallback(async (panelId: string) => {
    const snippet = buildIframeSnippet(filters.snapshot, false, themeMode, panelId, 720);
    let clipboardError: string | null = null;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
        setFeedback('Panel embed copied');
        return;
      }
    } catch (err) { clipboardError = getClipboardErrorMessage(err, 'Panel embed'); }
    window.prompt('Copy this iframe snippet', snippet);
    setFeedback(clipboardError ?? 'Panel embed ready');
  }, [filters.snapshot, themeMode]);

  const handlePrint       = useCallback(() => { setFeedback('Opening print dialog'); window.print(); }, []);
  const handleToggleSplit = useCallback(() => { setSplitMode((p) => !p); setFeedback(splitMode ? 'Split layout disabled' : 'Split layout enabled'); }, [splitMode]);
  const handleToggleTheme = useCallback(() => { const next = themeMode === 'light' ? 'dark' : 'light'; setThemeMode(next); setFeedback(next === 'light' ? 'Light mode enabled' : 'Dark mode enabled'); }, [themeMode]);
  const handleBack        = useCallback(() => { if (window.history.length > 1) { window.history.back(); } else { setFeedback('No previous page in history'); } }, []);

  // ── Driver context value (shared with all tab components via DriverProvider) ─
  const driverContextValue = useMemo(
    () => ({
      driverNums:  data.filters.driverNums,
      driverMap:   data.selectionData.driverMap,
      driverColor: data.viewModel.driverColor,
    }),
    [data.filters.driverNums, data.selectionData.driverMap, data.viewModel.driverColor],
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <DriverProvider {...driverContextValue}>
    <DashboardShell
      data={data}
      splitMode={splitMode}
      embedMode={embedMode}
      themeMode={themeMode}
      presetName={presetName}
      presetNames={presetNames}
      feedback={feedback}
      summaryPills={summaryPills}
      quickChips={quickChips}
      embedTitle={embedTitle}
      embedSubtitle={embedSubtitle}
      embedContext={embedContext}
      openDashboardUrl={openDashboardUrl}
      contentLayoutClass={contentLayoutClass}
      pageShellClass={pageShellClass}
      tabBoundaryResetKey={tabBoundaryResetKey}
      onPresetNameChange={handlePresetNameChange}
      onSavePreset={handleSavePreset}
      onShare={handleShare}
      onShareTab={handleShareTab}
      onEmbed={handleEmbed}
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
