import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import type { DashboardFilterSnapshot } from '../hooks/useDashboardFilters';
import { useDashboardSelectionData } from '../hooks/useDashboardSelectionData';
import { useDashboardViewModel } from '../hooks/useDashboardViewModel';
import {
  useDrivers,
  useLapTelemetry,
  useLaps,
  useMeetings,
  usePits,
  useRaceControl,
  useSessions,
  useStints,
  useTeamRadio,
  useWeather,
} from '../hooks/useOpenF1';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardSelectors } from './dashboard/DashboardSelectors';
import { DashboardTabs } from './dashboard/DashboardTabs';
import { DriverSelector } from './dashboard/DriverSelector';
import { EnergyTab } from './dashboard/EnergyTab';
import { IncidentsTab } from './dashboard/IncidentsTab';
import { RadioTab } from './dashboard/RadioTab';
import { TelemetryTab } from './dashboard/TelemetryTab';
import { StrategyTab } from './dashboard/StrategyTab';
import { WeatherTab } from './dashboard/WeatherTab';
import { Err } from './dashboard/shared';

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
  return `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
}

function buildIframeSnippet(snapshot: DashboardFilterSnapshot, splitMode: boolean, themeMode: ThemeMode) {
  const src = buildDashboardUrl(snapshot, splitMode, true, themeMode);
  const background = themeMode === 'light' ? '#f6efe3' : '#090a12';
  return [
    `<iframe`,
    `  src="${src}"`,
    `  title="f1stories.gr F1 Telemetry Dashboard"`,
    `  width="100%"`,
    `  height="920"`,
    `  loading="lazy"`,
    `  style="border:0; width:100%; max-width:100%; background:${background};"`,
    `></iframe>`,
  ].join('\n');
}

export default function F1TelemetryDashboard() {
  const filters = useDashboardFilters();
  const setLapNum = filters.setLapNum;
  const [splitMode, setSplitMode] = useState(readInitialSplitMode);
  const [embedMode] = useState(readInitialEmbedMode);
  const [themeMode, setThemeMode] = useState<ThemeMode>(readInitialThemeMode);
  const [presetName, setPresetName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<Record<string, SavedPreset>>(readSavedPresets);

  const meetings = useMeetings(filters.year);
  const sessions = useSessions(filters.year, filters.circuit);
  const drivers = useDrivers(filters.sessionKey);

  const lapStates = [
    useLaps(filters.sessionKey, filters.driverNums[0]),
    useLaps(filters.sessionKey, filters.driverNums[1]),
    useLaps(filters.sessionKey, filters.driverNums[2]),
    useLaps(filters.sessionKey, filters.driverNums[3]),
  ];

  const stints = useStints(filters.sessionKey);
  const pits = usePits(filters.sessionKey);
  const weather = useWeather(filters.sessionKey);
  const raceControl = useRaceControl(filters.sessionKey);
  const teamRadio = useTeamRadio(filters.sessionKey);

  const selectionData = useDashboardSelectionData({
    meetings: meetings.data,
    sessions: sessions.data,
    drivers: drivers.data,
    lapStates,
    circuit: filters.circuit,
    sessionKey: filters.sessionKey,
    driverNums: filters.driverNums,
    lapNum: filters.lapNum,
    setCircuit: filters.setCircuit,
    setSessionKey: filters.setSessionKey,
    setDriverNums: filters.setDriverNums,
    setLapNum: filters.setLapNum,
  });

  const telemetryStates = [
    useLapTelemetry(
      filters.sessionKey,
      filters.driverNums[0],
      selectionData.telemetryWindows[0]?.lapStart || null,
      selectionData.telemetryWindows[0]?.nextLapStart || null,
    ),
    useLapTelemetry(
      filters.sessionKey,
      filters.driverNums[1],
      selectionData.telemetryWindows[1]?.lapStart || null,
      selectionData.telemetryWindows[1]?.nextLapStart || null,
    ),
    useLapTelemetry(
      filters.sessionKey,
      filters.driverNums[2],
      selectionData.telemetryWindows[2]?.lapStart || null,
      selectionData.telemetryWindows[2]?.nextLapStart || null,
    ),
    useLapTelemetry(
      filters.sessionKey,
      filters.driverNums[3],
      selectionData.telemetryWindows[3]?.lapStart || null,
      selectionData.telemetryWindows[3]?.nextLapStart || null,
    ),
  ];
  const primaryTelemetry = telemetryStates[0];
  const telemetryByDriver = Object.fromEntries(
    filters.driverNums.map((driverNumber, index) => [driverNumber, telemetryStates[index]?.data || null]),
  ) as Record<number, ReturnType<typeof useLapTelemetry>['data']>;

  const viewModel = useDashboardViewModel({
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

  const anyLoading = meetings.loading || sessions.loading || drivers.loading;
  const lapsLoading = lapStates.some((state) => state.loading);
  const telemetryLoading = telemetryStates.some((state) => state.loading);
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
    return [
      { label: leader?.lapTime ? `Fastest ${leader.name} ${leader.lapTime.toFixed(3)}s` : `Focus L${filters.lapNum}`, tone: 'purple' as const },
      { label: `Pits ${viewModel.filteredPits.length}`, tone: 'amber' as const },
      { label: `Drivers ${filters.driverNums.length}`, tone: 'blue' as const },
      { label: `Laps ${selectionData.lapOptions.length}`, tone: 'neutral' as const },
    ];
  }, [filters.driverNums.length, filters.lapNum, selectionData.lapOptions.length, viewModel.filteredPits.length, viewModel.lapSummaries]);
  const defaultPresetName = useMemo(() => {
    const gp = filters.circuit || 'session';
    return `${gp.toLowerCase().replace(/\s+/g, '-')}-lap-${filters.lapNum}`;
  }, [filters.circuit, filters.lapNum]);
  const presetNames = useMemo(
    () => Object.values(savedPresets).sort((left, right) => right.savedAt.localeCompare(left.savedAt)).map((preset) => preset.name),
    [savedPresets],
  );
  const contentLayoutClass = splitMode
    ? 'grid gap-6 pb-16 xl:grid-cols-2 xl:[&>*:first-child]:col-span-2'
    : 'space-y-6 pb-16';
  const pageShellClass = embedMode
    ? 'relative mx-auto max-w-[1500px] px-3 py-2 sm:px-5'
    : 'relative mx-auto max-w-[1500px] px-5 sm:px-8';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = buildDashboardUrl(filters.snapshot, splitMode, embedMode, themeMode);
    window.history.replaceState({}, '', url);
  }, [embedMode, filters.snapshot, splitMode, themeMode]);

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

    const themeColor = themeMode === 'light' ? '#f6efe3' : '#090a12';
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

  const handleShare = useCallback(async () => {
    const url = buildDashboardUrl(filters.snapshot, splitMode, embedMode, themeMode);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setFeedback('Share link copied');
        return;
      }
    } catch {
      // Fall back to navigator.share or prompt flow below.
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: 'f1stories.gr F1 Telemetry Dashboard', url });
        setFeedback('Share sheet opened');
        return;
      }
    } catch {
      // Ignore canceled shares and use the prompt fallback.
    }

    window.prompt('Copy this link', url);
    setFeedback('Share link ready');
  }, [embedMode, filters.snapshot, splitMode, themeMode]);

  const handleEmbed = useCallback(async () => {
    const snippet = buildIframeSnippet(filters.snapshot, splitMode, themeMode);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snippet);
        setFeedback('Embed code copied');
        return;
      }
    } catch {
      // Fall back to a prompt when clipboard access is unavailable.
    }

    window.prompt('Copy this iframe snippet', snippet);
    setFeedback('Embed code ready');
  }, [filters.snapshot, splitMode, themeMode]);

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
    <div className={`dashboard-app min-h-screen ${themeMode === 'light' ? 'theme-light' : 'theme-dark'} ${embedMode ? 'embed-mode' : ''}`}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: 'linear-gradient(var(--app-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--app-grid-line) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <div className={pageShellClass}>
        <DashboardHeader
          loading={anyLoading}
          presetName={presetName}
          presetNames={presetNames}
          feedback={feedback}
          splitMode={splitMode}
          embedMode={embedMode}
          themeMode={themeMode}
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
          onYearChange={filters.handleYearChange}
          onCircuitChange={filters.handleCircuitChange}
          onSessionChange={filters.handleSessionChange}
          onLapChange={setLapNum}
          onStepLap={stepLap}
        />

        {meetings.error && <Err msg={`Failed to load calendar: ${meetings.error}`} />}
        {sessions.error && <Err msg={`Failed to load sessions: ${sessions.error}`} />}
        {drivers.error && <Err msg={`Failed to load drivers: ${drivers.error}`} />}

        <DriverSelector
          drivers={selectionData.driverList}
          selectedDrivers={filters.driverNums}
          onToggle={filters.toggleDriver}
        />

        <DashboardTabs activeTab={filters.tab} onChange={filters.setTab} />

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
              lapTimeData={viewModel.lapTimeData}
              lapDeltaData={viewModel.lapDeltaData}
              lapSummaries={viewModel.lapSummaries}
              driverNums={filters.driverNums}
              driverMap={selectionData.driverMap}
              driverColor={viewModel.driverColor}
            />
          )}

          {filters.tab === 'tires' && (
            <StrategyTab
              lapNum={filters.lapNum}
              driverNums={filters.driverNums}
              driverMap={selectionData.driverMap}
              stintsLoading={stints.loading}
              stintsByDriver={viewModel.stintsByDriver}
              pitsLoading={pits.loading}
              filteredPits={viewModel.filteredPits}
            />
          )}

          {filters.tab === 'energy' && (
            <EnergyTab
              lapNum={filters.lapNum}
              driverNums={filters.driverNums}
              driverMap={selectionData.driverMap}
              speedData={viewModel.speedData}
              telemetryLoading={telemetryLoading}
            />
          )}

          {filters.tab === 'radio' && (
            <RadioTab
              loading={teamRadio.loading}
              error={teamRadio.error}
              messages={viewModel.filteredRadio}
              driverMap={selectionData.driverMap}
            />
          )}

          {filters.tab === 'incidents' && (
            <IncidentsTab
              loading={raceControl.loading}
              error={raceControl.error}
              messages={viewModel.raceControlMessages}
            />
          )}

          {filters.tab === 'weather' && (
            <WeatherTab
              loading={weather.loading}
              error={weather.error}
              latestWeather={viewModel.latestWeather}
              sampleCount={weather.data?.length || 0}
              weatherRadar={viewModel.weatherRadar}
              weatherTrend={viewModel.weatherTrend}
            />
          )}
        </div>
      </div>
    </div>
  );
}
