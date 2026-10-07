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
import { useEmbedHeightReporter } from '../hooks/useEmbedHeightReporter';
import type { DashboardFilterSnapshot } from '../hooks/useDashboardFilters';
import { COLORS, chartColorForTheme } from '../constants/colors';
import { DriverProvider } from '../contexts/DriverContext';
import { DashboardShell } from './DashboardShell';
import { TAB_LABELS } from './dashboard/tabLabels';
import { copy } from '../copy';
import type { Tab } from './dashboard/types';
import { buildDashboardLink } from '../embeds/links';
import { EmbedComposer, type FigureDraft } from '../embeds/EmbedComposer';
import { EmbedDialog } from '../embeds/EmbedDialog';
import { figurePlotData, omitUnavailableFigureDrivers } from '../embeds/plotModel';
import { cornerMarks } from './dashboard/cornerMarks';
import type { EmbedPanelId } from '../embeds/contract';

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
const THEME_STORAGE_KEY  = 'f1stories-theme'; // same key as f1stories.gr (theme-init.js); index.html migrates the old app key

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
    const fromStorage = normalizeThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
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
  themeMode?: ThemeMode,
  anchorId?: string,
) {
  if (typeof window === 'undefined') return '';
  return buildDashboardLink(window.location.origin + window.location.pathname, snapshot, {
    split: splitMode, embed: embedMode, theme: themeMode,
    anchor: anchorId ?? (embedMode ? '' : window.location.hash),
  });
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
  useEmbedHeightReporter(embedMode);
  const [composer, setComposer] = useState<{ panel: string | null; drafts: Partial<Record<EmbedPanelId, FigureDraft>>; emptyMessage: string; legacy: (panel: EmbedPanelId | null) => string } | null>(null);
  const [embedDialog, setEmbedDialog] = useState<{ snapshot: DashboardFilterSnapshot; panel: string | null; context: string } | null>(null);
  // Publication URLs keep their requested panel while API loading triggers rerenders.
  const [embedPanel]                    = useState(() => readInitialEmbedMode() ? window.location.hash.slice(1) : undefined);
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
    () => buildDashboardUrl(filters.snapshot, splitMode, false, themeMode, embedPanel),
    [filters.snapshot, splitMode, themeMode, embedPanel],
  );

  // ── Side effects ───────────────────────────────────────────────────────

  // Sync URL on any filter/layout change. The address bar carries ?theme= only for embeds: elsewhere a
  // reload or bookmark must follow the stored 'f1stories-theme' choice, which ?theme= would override.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = buildDashboardUrl(filters.snapshot, splitMode, embedMode, embedMode ? themeMode : undefined, embedPanel);
    if (url === window.location.href) return;
    // Safari throws SecurityError past ~100 calls per 10 s; the next real change writes the URL again.
    try { window.history.replaceState({}, '', url); } catch { /* rate limited */ }
  }, [embedMode, embedPanel, filters.snapshot, splitMode, themeMode]);

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

  const handleShareTab = useCallback(async (tab: Tab) => shareSnapshot({ ...filters.snapshot, tab }, `${TAB_LABELS[tab]} link`), [filters.snapshot, shareSnapshot]);
  const handleOpenComposer = useCallback((tab: Tab, initialPanel: string | null) => {
    const snapshot = Object.freeze({ ...filters.snapshot, tab, driverNums: [...filters.driverNums] });
    const drafts: Partial<Record<EmbedPanelId, FigureDraft>> = {};
    const scopeResolved = Boolean(snapshot.circuit && snapshot.sessionKey != null && snapshot.driverNums.length > 0);
    const lapWindowsMatch = data.selectionData.telemetryWindows.length === snapshot.driverNums.length
      && data.selectionData.telemetryWindows.every((window) => data.selectionData.allLaps[window.driverNumber]
        ?.find((lap) => lap.lap_number === snapshot.lapNum)?.date_start === window.lapStart);
    const pending = data.anyLoading || data.driversPending || data.lapsPending || data.telemetryLoading || data.lapsLoading || !lapWindowsMatch
      || !data.comparisonDrivers.every((driver) => !driver.loading && driver.known);
    if (tab === 'telemetry' && snapshot.circuit && snapshot.sessionKey != null && snapshot.driverNums.length > 0
      && !pending) {
      const map = data.selectionData.driverMap;
      const byColour = new Map<string, number[]>();
      for (const driver of Object.values(map)) byColour.set(driver.team_colour, [...(byColour.get(driver.team_colour) ?? []), driver.driver_number]);
      byColour.forEach((numbers) => numbers.sort((a, b) => a - b));
      const lineDashes = [undefined, '10 4', '2 4', '10 4 2 4'];
      const brakeDashes = ['6 4', '10 3 2 3', '2 3', '10 3 2 3 2 3'];
      const drivers = snapshot.driverNums.map((number) => {
        const driver = map[number];
        const index = (byColour.get(driver.team_colour)?.indexOf(number) ?? 0) % 4;
        return {
          number, fullName: driver.full_name, acronym: driver.name_acronym, teamColour: `#${driver.team_colour}`,
          lineDash: lineDashes[index], brakeDash: brakeDashes[index],
        };
      });
      const speed = figurePlotData('speed', drivers, data.viewModel.speedData, data.viewModel.comparisonSpeedData, cornerMarks(data.viewModel.comparisonSpeedData, snapshot.driverNums[0], (n) => `C${n}`));
      const pedals = figurePlotData('pedals', drivers, data.viewModel.speedData, data.viewModel.comparisonControlData, cornerMarks(data.viewModel.comparisonSpeedData, snapshot.driverNums[0], (n) => `C${n}`));
      const session = data.selectionData.sessionOptions.find((option) => option.v === snapshot.sessionKey)?.l ?? `Session ${snapshot.sessionKey}`;
      const makeDraft = (plot: typeof speed): FigureDraft | undefined => {
        if (plot.points.length < 2) return undefined;
        const completeNumbers = new Set(plot.drivers.filter((driver) => {
          const lap = data.selectionData.allLaps[driver.number]?.find((item) => item.lap_number === snapshot.lapNum);
          return Boolean(lap?.lap_duration && lap.lap_duration > 0 && data.telemetryByDriver[driver.number]?.length);
        }).map((driver) => driver.number));
        const publishedPlot = omitUnavailableFigureDrivers(plot, completeNumbers);
        const provenanceDrivers = publishedPlot.drivers.map((driver, index) => {
          const values = publishedPlot.points.filter((point) => Object.entries(point).some(([key, value]) => key !== 'progress' && key !== 'idx' && key.endsWith(`_${driver.number}`) && typeof value === 'number')
            || publishedPlot.axis === 'sample' && index === 0 && publishedPlot.points.some((point) => Object.entries(point).some(([key, value]) => ['speed', 'throttle', 'brake'].includes(key) && typeof value === 'number')));
          const status = values.length > 0 && completeNumbers.has(driver.number) && !(publishedPlot.axis === 'sample' && index > 0) ? 'complete' as const : 'missing' as const;
          return { driverNumber: driver.number, status, sampleCount: status === 'complete' ? data.telemetryByDriver[driver.number]?.length ?? 0 : 0 };
        });
        if (!provenanceDrivers.some((driver) => driver.status === 'complete')) return undefined;
        return {
          scope: { year: snapshot.year, circuit: snapshot.circuit as string, sessionKey: snapshot.sessionKey as number, driverNums: [...snapshot.driverNums], lapNum: snapshot.lapNum, tab: 'telemetry' },
          context: { grandPrix: `${snapshot.circuit} Grand Prix`, session }, data: publishedPlot,
          provenance: {
            source: 'OpenF1', method: `${plot.kind === 'speed' ? 'Speed' : 'Throttle and brake'} car data plotted on the ${publishedPlot.axis === 'progress' ? 'normalized lap-progress axis' : 'sample axis'}.`,
            guideExplanation: publishedPlot.guides.length ? 'Vertical guides identify the slow-corner marks inferred by the telemetry repository from the comparison speed trace.' : '',
            partialAcknowledged: false, drivers: provenanceDrivers,
          },
        };
      };
      const speedDraft = makeDraft(speed);
      const pedalDraft = makeDraft(pedals);
      if (speedDraft) drafts['telemetry-speed-trace'] = structuredClone(speedDraft);
      if (pedalDraft) drafts['telemetry-throttle-brake'] = structuredClone(pedalDraft);
    }
    const legacySnapshot = { ...snapshot };
    setComposer({
      panel: initialPanel,
      drafts,
      emptyMessage: tab !== 'telemetry' || initialPanel && !['telemetry-speed-trace', 'telemetry-throttle-brake'].includes(initialPanel)
        ? copy.embed.unsupported
        : !scopeResolved ? copy.embed.missingScope : pending ? copy.embed.waiting : copy.embed.noPlot,
      legacy: (panel) => buildIframeSnippet(legacySnapshot, false, themeMode, panel ?? undefined, panel ? 720 : 920),
    });
  }, [data, filters.driverNums, filters.snapshot, themeMode]);

  const handleOpenEmbed = useCallback((tab: Tab, panel: string | null) => {
    setEmbedDialog({
      snapshot: { ...filters.snapshot, tab, driverNums: [...filters.driverNums] }, panel,
      context: `${filters.snapshot.year} · ${filters.snapshot.circuit ?? ''} · ${sessionLabel} · ${filters.driverNums.map(number => data.selectionData.driverMap[number]?.name_acronym ?? `#${number}`).join(' / ')} · L${filters.snapshot.lapNum}`,
    });
  }, [data.selectionData.driverMap, filters.driverNums, filters.snapshot, sessionLabel]);
  const handleEmbedTab = useCallback((tab: Tab) => handleOpenEmbed(tab, null), [handleOpenEmbed]);
  const handleEmbedPanel = useCallback((panelId: string) => handleOpenEmbed('telemetry', panelId), [handleOpenEmbed]);

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
    {embedDialog && <EmbedDialog
      snapshot={embedDialog.snapshot}
      initialPanel={embedDialog.panel}
      context={embedDialog.context}
      theme={themeMode}
      baseUrl={window.location.origin + window.location.pathname}
      onClose={() => setEmbedDialog(null)}
      onExport={(panel) => { setEmbedDialog(null); handleOpenComposer(embedDialog.snapshot.tab, panel); }}
    />}
    {composer && <EmbedComposer
      initialPanel={composer.panel}
      drafts={composer.drafts}
      emptyMessage={composer.emptyMessage}
      theme={themeMode}
      analysisBase={window.location.origin + (import.meta.env.VITE_F1STORIES_BUILD === 'true' ? '/telemetry/' : window.location.pathname)}
      legacySnippet={(panel) => composer.legacy(panel)}
      onClose={() => setComposer(null)}
      onLegacy={(snippet) => void copySnippet(snippet, 'Legacy iframe')}
    />}
    </DriverProvider>
  );
}
