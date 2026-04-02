import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import type { DashboardFilterSnapshot } from '../hooks/useDashboardFilters';
import { useDashboardSelectionData } from '../hooks/useDashboardSelectionData';
import { useDashboardViewModel } from '../hooks/useDashboardViewModel';
import {
  useDrivers,
  useIntervals,
  useLapLocation,
  useLapTelemetry,
  useLaps,
  useMeetings,
  usePits,
  usePositions,
  useRaceControl,
  useSessions,
  useSessionResult,
  useStints,
  useTeamRadio,
  useWeather,
} from '../hooks/useOpenF1';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardSelectors } from './dashboard/DashboardSelectors';
import { DashboardTabs } from './dashboard/DashboardTabs';
import { DriverSelector } from './dashboard/DriverSelector';
import { TelemetryTab } from './dashboard/TelemetryTab';
import { TrackMapTab } from './dashboard/TrackMapTab';
import { Err } from './dashboard/shared';
import type { Tab } from './dashboard/types';

type ThemeMode = 'dark' | 'light';

type SavedPreset = {
  name: string;
  snapshot: DashboardFilterSnapshot;
  splitMode: boolean;
  themeMode?: ThemeMode;
  savedAt: string;
};

const PRESET_STORAGE_KEY = 'f1-telemetry-dashboard:presets';
const THEME_STORAGE_KEY = 'f1-telemetry-dashboard:theme';
const TAB_LABELS = {
  telemetry: 'Telemetry',
  tires: 'Tyres & Strategy',
  energy: 'DRS, Gears & RPM',
  trackmap: 'Track Map',
  positions: 'Race Positions',
  intervals: 'Intervals',
  radio: 'Team Radio',
  incidents: 'Race Control',
  weather: 'Weather',
} as const;

const StrategyTab = lazy(() => import('./dashboard/StrategyTab').then((module) => ({ default: module.StrategyTab })));
const EnergyTab = lazy(() => import('./dashboard/EnergyTab').then((module) => ({ default: module.EnergyTab })));
const RadioTab = lazy(() => import('./dashboard/RadioTab').then((module) => ({ default: module.RadioTab })));
const IncidentsTab = lazy(() => import('./dashboard/IncidentsTab').then((module) => ({ default: module.IncidentsTab })));
const WeatherTab = lazy(() => import('./dashboard/WeatherTab').then((module) => ({ default: module.WeatherTab })));
const PositionsTab = lazy(() => import('./dashboard/PositionsTab').then((module) => ({ default: module.PositionsTab })));
const IntervalsTab = lazy(() => import('./dashboard/IntervalsTab').then((module) => ({ default: module.IntervalsTab })));

function TabLoadingPlaceholder({ label }: { label: string }) {
  return (
    <div className="dashboard-panel rounded-[16px] p-6 text-sm text-[color:var(--text-muted)] sm:rounded-[18px] sm:p-8">
      {label}
    </div>
  );
}

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

  const params = new URLSearchParams(window.location.search);
  const fromQuery = normalizeThemeMode(params.get('theme'));
  if (fromQuery) return fromQuery;

  try {
    const fromStorage = normalizeThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
    if (fromStorage) return fromStorage;
  } catch {
    // Ignore storage failures and fall back to the default theme.
  }

  return 'dark';
}

function readSavedPresets() {
  if (typeof window === 'undefined') return {} as Record<string, SavedPreset>;
  try {
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SavedPreset>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

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
  const hash = anchorId ? `#${anchorId}` : window.location.hash;
  return `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ''}${hash}`;
}

function buildIframeSnippet(
  snapshot: DashboardFilterSnapshot,
  splitMode: boolean,
  themeMode: ThemeMode,
  anchorId?: string,
  iframeHeight = 920,
) {
  const src = buildDashboardUrl(snapshot, splitMode, true, themeMode, anchorId);
  const background = themeMode === 'light' ? '#ffffff' : '#111113';
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

export default function F1TelemetryDashboard() {
  const filters = useDashboardFilters();
  const setLapNum = filters.setLapNum;
  const needsTelemetryData = filters.tab === 'telemetry' || filters.tab === 'energy';
  const needsStrategyData = filters.tab === 'tires';
  const needsRadioData = filters.tab === 'radio';
  const needsIncidentsData = filters.tab === 'incidents';
  const needsWeatherData = filters.tab === 'weather';
  const needsLocationData = filters.tab === 'trackmap';
  const needsPositionsData = filters.tab === 'positions';
  const needsIntervalsData = filters.tab === 'intervals';
  const [splitMode, setSplitMode] = useState(readInitialSplitMode);
  const [embedMode] = useState(readInitialEmbedMode);
  const [themeMode, setThemeMode] = useState<ThemeMode>(readInitialThemeMode);
  const [presetName, setPresetName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<Record<string, SavedPreset>>(readSavedPresets);

  const meetings = useMeetings(filters.year);
  const sessions = useSessions(filters.year, filters.circuit);
  const drivers = useDrivers(filters.sessionKey);
  const sessionResults = useSessionResult(filters.sessionKey);

  const lapStates = [
    useLaps(filters.sessionKey, filters.driverNums[0]),
    useLaps(filters.sessionKey, filters.driverNums[1]),
    useLaps(filters.sessionKey, filters.driverNums[2]),
    useLaps(filters.sessionKey, filters.driverNums[3]),
  ];

  const stints = useStints(needsStrategyData ? filters.sessionKey : null);
  const pits = usePits(needsStrategyData ? filters.sessionKey : null);
  const weather = useWeather(needsWeatherData ? filters.sessionKey : null);
  const raceControl = useRaceControl(needsIncidentsData ? filters.sessionKey : null);
  const teamRadio = useTeamRadio(needsRadioData ? filters.sessionKey : null);
  const positions = usePositions(needsPositionsData ? filters.sessionKey : null);
  const intervals = useIntervals(needsIntervalsData ? filters.sessionKey : null);

  const selectionData = useDashboardSelectionData({
    meetings: meetings.data,
    sessions: sessions.data,
    drivers: drivers.data,
    sessionResults: sessionResults.data,
    sessionResultsLoading: sessionResults.loading,
    lapStates,
    circuit: filters.circuit,
    sessionKey: filters.sessionKey,
    driverNums: filters.driverNums,
    lapNum: filters.lapNum,
    driverSelectionAuto: filters.driverSelectionAuto,
    lapSelectionAuto: filters.lapSelectionAuto,
    setCircuit: filters.setCircuit,
    setSessionKey: filters.setSessionKey,
    setDriverNums: filters.setAutoDriverNums,
    setLapNum: filters.setAutoLapNum,
  });

  const telemetryStates = [
    useLapTelemetry(
      filters.sessionKey,
      filters.driverNums[0],
      needsTelemetryData ? selectionData.telemetryWindows[0]?.lapStart || null : null,
      needsTelemetryData ? selectionData.telemetryWindows[0]?.nextLapStart || null : null,
    ),
    useLapTelemetry(
      filters.sessionKey,
      filters.driverNums[1],
      needsTelemetryData ? selectionData.telemetryWindows[1]?.lapStart || null : null,
      needsTelemetryData ? selectionData.telemetryWindows[1]?.nextLapStart || null : null,
    ),
    useLapTelemetry(
      filters.sessionKey,
      filters.driverNums[2],
      needsTelemetryData ? selectionData.telemetryWindows[2]?.lapStart || null : null,
      needsTelemetryData ? selectionData.telemetryWindows[2]?.nextLapStart || null : null,
    ),
    useLapTelemetry(
      filters.sessionKey,
      filters.driverNums[3],
      needsTelemetryData ? selectionData.telemetryWindows[3]?.lapStart || null : null,
      needsTelemetryData ? selectionData.telemetryWindows[3]?.nextLapStart || null : null,
    ),
  ];

  const locationStates = [
    useLapLocation(needsLocationData ? filters.sessionKey : null, filters.driverNums[0], needsLocationData ? selectionData.telemetryWindows[0]?.lapStart || null : null, needsLocationData ? selectionData.telemetryWindows[0]?.nextLapStart || null : null),
    useLapLocation(needsLocationData ? filters.sessionKey : null, filters.driverNums[1], needsLocationData ? selectionData.telemetryWindows[1]?.lapStart || null : null, needsLocationData ? selectionData.telemetryWindows[1]?.nextLapStart || null : null),
    useLapLocation(needsLocationData ? filters.sessionKey : null, filters.driverNums[2], needsLocationData ? selectionData.telemetryWindows[2]?.lapStart || null : null, needsLocationData ? selectionData.telemetryWindows[2]?.nextLapStart || null : null),
    useLapLocation(needsLocationData ? filters.sessionKey : null, filters.driverNums[3], needsLocationData ? selectionData.telemetryWindows[3]?.lapStart || null : null, needsLocationData ? selectionData.telemetryWindows[3]?.nextLapStart || null : null),
  ];
  const locationByDriver = Object.fromEntries(
    filters.driverNums.map((driverNum, index) => [driverNum, locationStates[index]?.data || null]),
  ) as Record<number, ReturnType<typeof useLapLocation>['data']>;
  const locationLoading = needsLocationData && locationStates.some((s) => s.loading);
  const primaryTelemetry = telemetryStates[0];
  const telemetryByDriver = Object.fromEntries(
    filters.driverNums.map((driverNumber, index) => [driverNumber, telemetryStates[index]?.data || null]),
  ) as Record<number, ReturnType<typeof useLapTelemetry>['data']>;

  const viewModel = useDashboardViewModel({
    activeTab: filters.tab,
    allLaps: selectionData.allLaps,
    driverMap: selectionData.driverMap,
    driverNums: filters.driverNums,
    lapNum: filters.lapNum,
    lapOptions: selectionData.lapOptions,
    stints: stints.data,
    pits: pits.data,
    weather: weather.data,
    raceControl: raceControl.data,
    teamRadio: teamRadio.data,
    telemetryByDriver,
  });

  const anyLoading = meetings.loading || sessions.loading || drivers.loading || sessionResults.loading;
  const lapsLoading = lapStates.some((state) => state.loading);
  const telemetryLoading = needsTelemetryData && telemetryStates.some((state) => state.loading);
  const totalLaps = selectionData.lapOptions.length > 0 ? selectionData.lapOptions[selectionData.lapOptions.length - 1] : null;
  const currentLapIndex = selectionData.lapOptions.indexOf(filters.lapNum);
  const canStepBackward = currentLapIndex > 0;
  const canStepForward = currentLapIndex >= 0 && currentLapIndex < selectionData.lapOptions.length - 1;
  const stepLap = useCallback((direction: -1 | 1) => {
    const nextIndex = currentLapIndex + direction;
    const nextLap = selectionData.lapOptions[nextIndex];
    if (nextLap != null) {
      setLapNum(nextLap);
    }
  }, [currentLapIndex, selectionData.lapOptions, setLapNum]);
  const yearOptions = useMemo(
    () => Array.from({ length: new Date().getFullYear() - 2022 }, (_, index) => 2023 + index),
    [],
  );
  const summaryPills = useMemo(() => {
    return viewModel.lapSummaries.slice(0, 2).map((summary, index) => ({
      label: `P${index + 1}`,
      driver: summary.name,
      detail: summary.gapToLeader != null && summary.gapToLeader > 0 ? `+${summary.gapToLeader.toFixed(3)}s` : summary.lapTime != null ? `${summary.lapTime.toFixed(3)}s` : '—',
      tone: index === 0 ? 'blue' as const : 'purple' as const,
    }));
  }, [viewModel.lapSummaries]);
  const quickChips = useMemo(() => {
    const leader = viewModel.lapSummaries[0];
    const pitLabel = needsStrategyData
      ? pits.loading
        ? 'Pits …'
        : `Pits ${viewModel.filteredPits.length}`
      : 'Pits —';
    return [
      { label: leader?.lapTime ? `Fastest ${leader.name} ${leader.lapTime.toFixed(3)}s` : `Focus L${filters.lapNum}`, tone: 'purple' as const },
      { label: pitLabel, tone: 'amber' as const },
      { label: `Drivers ${filters.driverNums.length}`, tone: 'blue' as const },
      { label: `Laps ${selectionData.lapOptions.length}`, tone: 'neutral' as const },
    ];
  }, [filters.driverNums.length, filters.lapNum, needsStrategyData, pits.loading, selectionData.lapOptions.length, viewModel.filteredPits.length, viewModel.lapSummaries]);
  const defaultPresetName = useMemo(() => {
    const gp = filters.circuit || 'session';
    return `${gp.toLowerCase().replace(/\s+/g, '-')}-lap-${filters.lapNum}`;
  }, [filters.circuit, filters.lapNum]);
  const presetNames = useMemo(
    () => Object.values(savedPresets).sort((left, right) => right.savedAt.localeCompare(left.savedAt)).map((preset) => preset.name),
    [savedPresets],
  );
  const sessionLabel = useMemo(
    () => selectionData.sessionOptions.find((option) => option.v === filters.sessionKey)?.l ?? (filters.sessionKey != null ? `Session ${filters.sessionKey}` : 'Session'),
    [filters.sessionKey, selectionData.sessionOptions],
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
      { label: 'Lap', value: `L${filters.lapNum}` },
      { label: 'Drivers', value: `${filters.driverNums.length}/4` },
      { label: 'View', value: TAB_LABELS[filters.tab] },
    ],
    [filters.driverNums.length, filters.lapNum, filters.tab],
  );
  const openDashboardUrl = useMemo(
    () => buildDashboardUrl(filters.snapshot, splitMode, false, themeMode),
    [filters.snapshot, splitMode, themeMode],
  );
  const contentLayoutClass = splitMode
    ? `grid ${embedMode ? 'gap-5 pb-8' : 'gap-4 pb-12 sm:gap-5 sm:pb-16'} xl:grid-cols-2 xl:[&>*:first-child]:col-span-2`
    : `${embedMode ? 'space-y-5 pb-8' : 'space-y-4 pb-12 sm:space-y-5 sm:pb-16'}`;
  const pageShellClass = embedMode
    ? 'relative mx-auto max-w-[1320px] px-3 py-3 sm:px-4 sm:py-4'
    : 'relative mx-auto max-w-[1440px] px-4 py-3 sm:px-6 sm:py-4';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = buildDashboardUrl(filters.snapshot, splitMode, embedMode, themeMode);
    window.history.replaceState({}, '', url);
  }, [embedMode, filters.snapshot, splitMode, themeMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      const target = window.document.getElementById(hash);
      attempts += 1;

      if (target) {
        target.scrollIntoView({ block: 'start' });
        window.clearInterval(timer);
        return;
      }

      if (attempts >= 12) {
        window.clearInterval(timer);
      }
    }, 120);

    return () => window.clearInterval(timer);
  }, [filters.tab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(savedPresets));
    } catch {
      // Ignore storage failures and keep the app usable.
    }
  }, [savedPresets]);

  useEffect(() => {
    if (!feedback || typeof window === 'undefined') return;

    const timeoutId = window.setTimeout(() => setFeedback(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    root.classList.toggle('theme-light', themeMode === 'light');
    root.classList.toggle('theme-dark', themeMode === 'dark');

    const themeColor = themeMode === 'light' ? '#ffffff' : '#111113';
    window.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // Ignore storage failures and keep the app usable.
    }
  }, [themeMode]);

  const handlePresetNameChange = useCallback((value: string) => {
    setPresetName(value);
    const preset = savedPresets[value];
    if (!preset) return;

    filters.applySnapshot(preset.snapshot);
    setSplitMode(preset.splitMode);
    if (preset.themeMode) {
      setThemeMode(preset.themeMode);
    }
    setFeedback(`Loaded preset ${preset.name}`);
  }, [filters, savedPresets]);

  const handleSavePreset = useCallback(() => {
    const name = presetName.trim() || defaultPresetName;
    const preset: SavedPreset = {
      name,
      snapshot: filters.snapshot,
      splitMode,
      themeMode,
      savedAt: new Date().toISOString(),
    };

    setSavedPresets((prev) => ({ ...prev, [name]: preset }));
    setPresetName(name);
    setFeedback(`Saved preset ${name}`);
  }, [defaultPresetName, filters.snapshot, presetName, splitMode, themeMode]);

  const shareSnapshot = useCallback(async (snapshot: DashboardFilterSnapshot, label: string) => {
    const url = buildDashboardUrl(snapshot, splitMode, embedMode, themeMode);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setFeedback(`${label} copied`);
        return;
      }
    } catch {
      // Fall back to navigator.share or prompt flow below.
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: `f1stories.gr ${TAB_LABELS[snapshot.tab]} view`, url });
        setFeedback(`${label} shared`);
        return;
      }
    } catch {
      // Ignore canceled shares and use the prompt fallback.
    }

    window.prompt('Copy this link', url);
    setFeedback(`${label} ready`);
  }, [embedMode, splitMode, themeMode]);

  const embedSnapshot = useCallback(async (snapshot: DashboardFilterSnapshot, label: string) => {
    const snippet = buildIframeSnippet(snapshot, splitMode, themeMode);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
        setFeedback(`${label} copied`);
        return;
      }
    } catch {
      // Fall back to a prompt when clipboard access is unavailable.
    }

    window.prompt('Copy this iframe snippet', snippet);
    setFeedback(`${label} ready`);
  }, [splitMode, themeMode]);

  const handleShare = useCallback(async () => {
    await shareSnapshot(filters.snapshot, 'Share link');
  }, [filters.snapshot, shareSnapshot]);

  const handleShareTab = useCallback(async (tab: Tab) => {
    await shareSnapshot({ ...filters.snapshot, tab }, `${TAB_LABELS[tab]} link`);
  }, [filters.snapshot, shareSnapshot]);

  const handleEmbed = useCallback(async () => {
    await embedSnapshot(filters.snapshot, 'Embed code');
  }, [embedSnapshot, filters.snapshot]);

  const handleEmbedTab = useCallback(async (tab: Tab) => {
    await embedSnapshot({ ...filters.snapshot, tab }, `${TAB_LABELS[tab]} embed`);
  }, [embedSnapshot, filters.snapshot]);

  const handleEmbedPanel = useCallback(async (panelId: string) => {
    const snippet = buildIframeSnippet(filters.snapshot, false, themeMode, panelId, 720);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
        setFeedback('Panel embed copied');
        return;
      }
    } catch {
      // Fall back to prompt when clipboard access is unavailable.
    }

    window.prompt('Copy this iframe snippet', snippet);
    setFeedback('Panel embed ready');
  }, [filters.snapshot, themeMode]);

  const handlePrint = useCallback(() => {
    setFeedback('Opening print dialog');
    window.print();
  }, []);

  const handleToggleSplit = useCallback(() => {
    setSplitMode((prev) => !prev);
    setFeedback(splitMode ? 'Split layout disabled' : 'Split layout enabled');
  }, [splitMode]);

  const handleToggleTheme = useCallback(() => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    setFeedback(nextTheme === 'light' ? 'Light mode enabled' : 'Dark mode enabled');
  }, [themeMode]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setFeedback('No previous page in history');
    }
  }, []);

  return (
    <div className={`dashboard-app ${embedMode ? '' : 'min-h-screen'} ${themeMode === 'light' ? 'theme-light' : 'theme-dark'} ${embedMode ? 'embed-mode' : ''}`}>
      <div className={pageShellClass}>
        <DashboardHeader
          loading={anyLoading}
          presetName={presetName}
          presetNames={presetNames}
          feedback={feedback}
          splitMode={splitMode}
          embedMode={embedMode}
          themeMode={themeMode}
          embedTitle={embedTitle}
          embedSubtitle={embedSubtitle}
          embedContext={embedContext}
          openDashboardUrl={openDashboardUrl}
          onPresetNameChange={handlePresetNameChange}
          onSavePreset={handleSavePreset}
          onShare={handleShare}
          onEmbed={handleEmbed}
          onPrint={handlePrint}
          onToggleSplit={handleToggleSplit}
          onToggleTheme={handleToggleTheme}
          onBack={handleBack}
        />

        <DashboardSelectors
          year={filters.year}
          circuit={filters.circuit}
          sessionKey={filters.sessionKey}
          lapNum={filters.lapNum}
          totalLaps={totalLaps}
          yearOptions={yearOptions}
          circuitOptions={selectionData.circuitOptions}
          sessionOptions={selectionData.sessionOptions}
          lapOptions={selectionData.lapOptions}
          meetingsLoading={meetings.loading}
          sessionsLoading={sessions.loading}
          lapsLoading={lapsLoading}
          summaryPills={summaryPills}
          quickChips={quickChips}
          canStepBackward={canStepBackward}
          canStepForward={canStepForward}
          embedMode={embedMode}
          onYearChange={filters.handleYearChange}
          onCircuitChange={filters.handleCircuitChange}
          onSessionChange={filters.handleSessionChange}
          onLapChange={setLapNum}
          onStepLap={stepLap}
        />

        {meetings.error && <Err msg={`Failed to load calendar: ${meetings.error}`} />}
        {sessions.error && <Err msg={`Failed to load sessions: ${sessions.error}`} />}
        {drivers.error && <Err msg={`Failed to load drivers: ${drivers.error}`} />}

        {!embedMode && (
          <DriverSelector
            drivers={selectionData.driverList}
            selectedDrivers={filters.driverNums}
            embedMode={embedMode}
            onToggle={filters.toggleDriver}
          />
        )}

        <DashboardTabs
          activeTab={filters.tab}
          onChange={filters.setTab}
          embedMode={embedMode}
          onShareTab={handleShareTab}
          onEmbedTab={handleEmbedTab}
        />

        <div className={contentLayoutClass}>
          {filters.tab === 'telemetry' && (
            <TelemetryTab
              lapNum={filters.lapNum}
              lapsLoading={lapsLoading}
              sectorRows={viewModel.sectorRows}
              telemetryLoading={telemetryLoading}
              telemetryError={primaryTelemetry?.error || null}
              telemetryPoints={primaryTelemetry?.data?.length || 0}
              speedData={viewModel.speedData}
              comparisonSpeedData={viewModel.comparisonSpeedData}
              comparisonControlData={viewModel.comparisonControlData}
              lapTimeData={viewModel.lapTimeData}
              lapDeltaData={viewModel.lapDeltaData}
              lapSummaries={viewModel.lapSummaries}
              driverNums={filters.driverNums}
              driverMap={selectionData.driverMap}
              driverColor={viewModel.driverColor}
              embedMode={embedMode}
              onEmbedPanel={handleEmbedPanel}
            />
          )}

          {filters.tab === 'tires' && (
            <Suspense fallback={<TabLoadingPlaceholder label="Loading strategy view..." />}>
              <StrategyTab
                lapNum={filters.lapNum}
                driverNums={filters.driverNums}
                driverMap={selectionData.driverMap}
              stintsLoading={stints.loading}
              stintsByDriver={viewModel.stintsByDriver}
              pitsLoading={pits.loading}
              filteredPits={viewModel.filteredPits}
              embedMode={embedMode}
              onEmbedPanel={handleEmbedPanel}
            />
          </Suspense>
          )}

          {filters.tab === 'energy' && (
            <Suspense fallback={<TabLoadingPlaceholder label="Loading energy view..." />}>
              <EnergyTab
                lapNum={filters.lapNum}
                driverNums={filters.driverNums}
                driverMap={selectionData.driverMap}
                speedData={viewModel.speedData}
                comparisonEnergyData={viewModel.comparisonEnergyData}
                lapSummaries={viewModel.lapSummaries}
                driverColor={viewModel.driverColor}
                telemetryLoading={telemetryLoading}
                embedMode={embedMode}
                onEmbedPanel={handleEmbedPanel}
              />
            </Suspense>
          )}

          {filters.tab === 'radio' && (
            <Suspense fallback={<TabLoadingPlaceholder label="Loading radio view..." />}>
              <RadioTab
                loading={teamRadio.loading}
                error={teamRadio.error}
                messages={viewModel.filteredRadio}
                driverMap={selectionData.driverMap}
              />
            </Suspense>
          )}

          {filters.tab === 'incidents' && (
            <Suspense fallback={<TabLoadingPlaceholder label="Loading race control view..." />}>
              <IncidentsTab
                loading={raceControl.loading}
                error={raceControl.error}
                messages={viewModel.raceControlMessages}
              />
            </Suspense>
          )}

          {filters.tab === 'weather' && (
            <Suspense fallback={<TabLoadingPlaceholder label="Loading weather view..." />}>
              <WeatherTab
                loading={weather.loading}
                error={weather.error}
                latestWeather={viewModel.latestWeather}
                sampleCount={weather.data?.length || 0}
                weatherRadar={viewModel.weatherRadar}
                weatherTrend={viewModel.weatherTrend}
                embedMode={embedMode}
                onEmbedPanel={handleEmbedPanel}
              />
            </Suspense>
          )}

          {filters.tab === 'trackmap' && (
            <TrackMapTab
              lapNum={filters.lapNum}
              driverNums={filters.driverNums}
              driverMap={selectionData.driverMap}
              locationByDriver={locationByDriver}
              locationLoading={locationLoading}
              driverColor={viewModel.driverColor}
              embedMode={embedMode}
              onEmbedPanel={handleEmbedPanel}
            />
          )}

          {filters.tab === 'positions' && (
            <Suspense fallback={<TabLoadingPlaceholder label="Loading race positions..." />}>
              <PositionsTab
                driverNums={filters.driverNums}
                driverMap={selectionData.driverMap}
                positions={positions.data}
                positionsLoading={positions.loading}
                lapNum={filters.lapNum}
                driverColor={viewModel.driverColor}
                embedMode={embedMode}
                onEmbedPanel={handleEmbedPanel}
              />
            </Suspense>
          )}

          {filters.tab === 'intervals' && (
            <Suspense fallback={<TabLoadingPlaceholder label="Loading interval data..." />}>
              <IntervalsTab
                driverNums={filters.driverNums}
                driverMap={selectionData.driverMap}
                intervals={intervals.data}
                intervalsLoading={intervals.loading}
                driverColor={viewModel.driverColor}
                embedMode={embedMode}
                onEmbedPanel={handleEmbedPanel}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
