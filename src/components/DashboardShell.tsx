/**
 * DashboardShell — pure presentational component for the F1 dashboard.
 *
 * Receives all data and handlers as props; contains no hooks or side effects.
 * This separation makes the UI layer independently testable: render
 * DashboardShell with mock props without any API calls or router state.
 */

import { Suspense, lazy, useMemo } from 'react';
import type { DashboardData } from '../hooks/useDashboard';
import type { OpenF1Lap } from '../api/openf1';
import type { Tab } from './dashboard/types';
import { TAB_LABELS } from './dashboard/tabLabels';
import { ErrorBoundary } from './ErrorBoundary';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { SignalBand } from './dashboard/SignalBand';
import { CardBar } from './dashboard/CardBar';
import { NextViews } from './dashboard/NextViews';
import { LapStrip } from './dashboard/LapStrip';
import { TabLeadContext } from './dashboard/tabLeadContext';
import { safetyCarLaps } from './dashboard/lapStripUtils';
import { buildGapCards } from './dashboard/gapCardData';
import { buildHeadline } from './dashboard/headlines';
import { SiteFooter } from './dashboard/SiteFooter';
import { pickNextMeeting } from './dashboard/nextMeeting';
import { copy } from '../copy';
import { DashboardSelectors } from './dashboard/DashboardSelectors';
import { DashboardTabs } from './dashboard/DashboardTabs';
import { DriverSelector } from './dashboard/DriverSelector';
import { ChartSkeleton, Err } from './dashboard/shared';

// ─── Lazy-loaded tab chunks ───────────────────────────────────────────────────

const TelemetryTab = lazy(() => import('./dashboard/TelemetryTab').then((m) => ({ default: m.TelemetryTab })));
const TrackMapTab  = lazy(() => import('./dashboard/TrackMapTab').then((m)  => ({ default: m.TrackMapTab })));
const StrategyTab  = lazy(() => import('./dashboard/StrategyTab').then((m)  => ({ default: m.StrategyTab })));
const EnergyTab    = lazy(() => import('./dashboard/EnergyTab').then((m)    => ({ default: m.EnergyTab })));
const RadioTab     = lazy(() => import('./dashboard/RadioTab').then((m)     => ({ default: m.RadioTab })));
const IncidentsTab = lazy(() => import('./dashboard/IncidentsTab').then((m) => ({ default: m.IncidentsTab })));
const WeatherTab   = lazy(() => import('./dashboard/WeatherTab').then((m)   => ({ default: m.WeatherTab })));
const PositionsTab = lazy(() => import('./dashboard/PositionsTab').then((m) => ({ default: m.PositionsTab })));
const IntervalsTab = lazy(() => import('./dashboard/IntervalsTab').then((m) => ({ default: m.IntervalsTab })));
const BroadcastTab = lazy(() => import('./dashboard/BroadcastTab').then((m) => ({ default: m.BroadcastTab })));

function TabLoadingPlaceholder({ label, skeletonClassName = 'h-32' }: { label: string; skeletonClassName?: string }) {
  return (
    <div className="dashboard-panel rounded-[16px] p-6 text-sm text-[color:var(--text-muted)] sm:rounded-[18px] sm:p-8">
      <ChartSkeleton label={label} className={skeletonClassName} />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type DashboardShellProps = {
  // ── Core data (from useDashboard) ──────────────────────────────────────
  data: DashboardData;

  // ── UI state ───────────────────────────────────────────────────────────
  splitMode: boolean;
  embedMode: boolean;
  themeMode: 'dark' | 'light';
  presetName: string;
  presetNames: string[];
  feedback: string | null;

  // ── Computed display values ────────────────────────────────────────────
  embedTitle: string;
  openDashboardUrl: string;
  contentLayoutClass: string;
  pageShellClass: string;
  tabBoundaryResetKey: string;

  // ── Handlers ───────────────────────────────────────────────────────────
  onPresetNameChange: (name: string) => void;
  onSavePreset: () => void;
  onShareTab: (tab: Tab) => Promise<void>;
  onEmbedTab: (tab: Tab) => Promise<void>;
  onEmbedPanel: (panelId: string) => Promise<void>;
  onPrint: () => void;
  onToggleSplit: () => void;
  onToggleTheme: () => void;
  onBack: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardShell({
  data,
  splitMode,
  embedMode,
  themeMode,
  presetName,
  presetNames,
  feedback,
  embedTitle,
  openDashboardUrl,
  contentLayoutClass,
  pageShellClass,
  tabBoundaryResetKey,
  onPresetNameChange,
  onSavePreset,
  onShareTab,
  onEmbedTab,
  onEmbedPanel,
  onPrint,
  onToggleSplit,
  onToggleTheme,
  onBack,
}: DashboardShellProps) {
  const {
    filters,
    meetings,
    sessions,
    drivers,
    stints,
    pits,
    weather,
    raceControl,
    teamRadio,
    positions,
    intervals,
    primaryTelemetry,
    comparisonDrivers,
    selectionData,
    viewModel,
    locationByDriver,
    anyLoading,
    lapsLoading,
    locationLoading,
    telemetryLoading,
    totalLaps,
    canStepBackward,
    canStepForward,
    stepLap,
    driversPending,
    lapsPending,
    expectsDrivers,
  } = data;

  const gapCards = useMemo(
    () => buildGapCards(viewModel.lapSummaries, viewModel.sectorRows, viewModel.cornerSplits),
    [viewModel.cornerSplits, viewModel.lapSummaries, viewModel.sectorRows],
  );
  const headline = useMemo(() => buildHeadline(filters.tab, {
    lapNum: filters.lapNum,
    driverNums: filters.driverNums,
    nameOf: (driverNumber) => selectionData.driverMap[driverNumber]?.last_name || selectionData.driverMap[driverNumber]?.name_acronym || `#${driverNumber}`,
    summaries: viewModel.lapSummaries,
    gapCards,
    stintsByDriver: viewModel.stintsByDriver,
    positions: positions.data,
  }), [filters.driverNums, filters.lapNum, filters.tab, gapCards, positions.data, selectionData.driverMap, viewModel.lapSummaries, viewModel.stintsByDriver]);

  const tabLead = useMemo(() => embedMode ? { kicker: '', cardBar: null, headline } : {
    kicker: [TAB_LABELS[filters.tab], LAP_TABS.includes(filters.tab) && copy.scope.lapOption(filters.lapNum)].filter(Boolean).join(' · '),
    cardBar: <CardBar tabLabel={TAB_LABELS[filters.tab]} onShare={() => void onShareTab(filters.tab)} onEmbed={() => void onEmbedTab(filters.tab)} />,
    headline,
  }, [embedMode, filters.lapNum, filters.tab, headline, onEmbedTab, onShareTab]);

  const stripDriver = filters.driverNums[0];
  const stripLaps = selectionData.allLaps[stripDriver];
  const stripSafetyCar = useMemo(() => safetyCarLaps(raceControl.data, totalLaps ?? 0), [raceControl.data, totalLaps]);

  const nextMeeting = useMemo(() => pickNextMeeting(meetings.data), [meetings.data]);

  const header = (
    <DashboardHeader
      presetName={presetName}
      presetNames={presetNames}
      splitMode={splitMode}
      embedMode={embedMode}
      themeMode={themeMode}
      openDashboardUrl={openDashboardUrl}
      heroSubtitle={`${embedTitle} · ${copy.hero.lap(filters.lapNum, totalLaps ?? 0)}`}
      nextMeeting={nextMeeting}
      onPresetNameChange={onPresetNameChange}
      onSavePreset={onSavePreset}
      onPrint={onPrint}
      onToggleSplit={onToggleSplit}
      onToggleTheme={onToggleTheme}
      onBack={onBack}
    />
  );

  return (
    <div
      className={[
        'dashboard-app',
        embedMode ? 'embed-mode' : 'min-h-screen',
      ].filter(Boolean).join(' ')}
    >
      {!embedMode && (
        <a
          href="#main-content"
          className="skip-link"
        >
          {copy.skipToContent}
        </a>
      )}
      {!embedMode && header}
      {!embedMode && <SignalBand loading={anyLoading} feedback={feedback} lapNum={filters.lapNum} totalLaps={totalLaps} drivers={comparisonDrivers} expectDrivers={expectsDrivers} lapsPending={lapsPending} />}
      <div className={pageShellClass}>
        {embedMode && header}

        <main id="main-content" tabIndex={-1}>
          {!embedMode && <>
          <DashboardSelectors
            year={filters.year}
            circuit={filters.circuit}
            sessionKey={filters.sessionKey}
            lapNum={filters.lapNum}
            totalLaps={totalLaps}
            yearOptions={YEAR_OPTIONS}
            circuitOptions={selectionData.circuitOptions}
            sessionOptions={selectionData.sessionOptions}
            lapOptions={selectionData.lapOptions}
            meetingsLoading={meetings.loading}
            sessionsLoading={sessions.loading}
            lapsLoading={lapsLoading}
            canStepBackward={canStepBackward}
            canStepForward={canStepForward}
            embedMode={embedMode}
            onYearChange={filters.handleYearChange}
            onCircuitChange={filters.handleCircuitChange}
            onSessionChange={filters.handleSessionChange}
            onLapChange={filters.setLapNum}
            onStepLap={stepLap}
          >
            <DriverSelector
              drivers={selectionData.driverList}
              selectedDrivers={filters.driverNums}
              embedMode={embedMode}
              pending={driversPending}
              onToggle={filters.toggleDriver}
            />
          </DashboardSelectors>

          {meetings.error   && <Err msg={`Failed to load calendar: ${meetings.error}`}   onAction={meetings.refetch} />}
          {sessions.error   && <Err msg={`Failed to load sessions: ${sessions.error}`}   onAction={sessions.refetch} />}
          {drivers.error    && <Err msg={`Failed to load drivers: ${drivers.error}`}     onAction={drivers.refetch} />}



          <LapStrip
            driverName={selectionData.driverMap[stripDriver]?.name_acronym || `#${stripDriver}`}
            laps={stripLaps ?? NO_LAPS}
            safetyCar={stripSafetyCar}
            lapNum={filters.lapNum}
            onSelect={filters.setLapNum}
            pending={lapsPending}
          />

          <DashboardTabs
            activeTab={filters.tab}
            onChange={filters.setTab}
            embedMode={embedMode}
            onShareTab={onShareTab}
            onEmbedTab={onEmbedTab}
          />

          </>}
          <ErrorBoundary label={TAB_LABELS[filters.tab]} resetKey={tabBoundaryResetKey}>
            {embedMode && comparisonDrivers.some((driver) => driver.status !== 'Loaded' && !driver.loading) && (
              <p className="embed-partial" role="status">
                {copy.band.partial(comparisonDrivers.filter((driver) => driver.status === 'Loaded').length, comparisonDrivers.length)}
                {comparisonDrivers.filter((driver) => driver.status !== 'Loaded' && !driver.loading).map((driver) => (
                  <span key={driver.driverNumber} title={driver.status}>
                    {' · '}{driver.retry ? <button className="signal-retry" onClick={driver.retry}>{copy.band.retry(driver.name)}</button> : driver.name}
                  </span>
                ))}
              </p>
            )}
            <TabLeadContext.Provider value={tabLead}>
            <div id="analysis-content" aria-label={TAB_LABELS[filters.tab]} className={contentLayoutClass}>
              {filters.tab === 'telemetry' && (
                <Suspense fallback={<TabLoadingPlaceholder label="Loading telemetry view..." skeletonClassName="h-[240px] sm:h-[380px]" />}>
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
                  gapCards={gapCards}
                  sessionTitle={embedTitle}
                  embedMode={embedMode}
                  onEmbedPanel={onEmbedPanel}
                  onTelemetryRetry={primaryTelemetry?.refetch}
                />
                </Suspense>
              )}

              {filters.tab === 'tires' && (
                <Suspense fallback={<TabLoadingPlaceholder label="Loading strategy view..." />}>
                  <StrategyTab
                    lapNum={filters.lapNum}
                    stintsLoading={stints.loading}
                    stintsByDriver={viewModel.stintsByDriver}
                    pitsLoading={pits.loading}
                    filteredPits={viewModel.filteredPits}
                    embedMode={embedMode}
                    onEmbedPanel={onEmbedPanel}
                  />
                </Suspense>
              )}

              {filters.tab === 'energy' && (
                <Suspense fallback={<TabLoadingPlaceholder label="Loading energy view..." />}>
                  <EnergyTab
                    lapNum={filters.lapNum}
                    speedData={viewModel.speedData}
                    comparisonEnergyData={viewModel.comparisonEnergyData}
                    lapSummaries={viewModel.lapSummaries}
                    telemetryLoading={telemetryLoading}
                    embedMode={embedMode}
                    onEmbedPanel={onEmbedPanel}
                  />
                </Suspense>
              )}

              {filters.tab === 'radio' && (
                <Suspense fallback={<TabLoadingPlaceholder label="Loading radio view..." />}>
                  <RadioTab
                    loading={teamRadio.loading}
                    error={teamRadio.error}
                    messages={viewModel.filteredRadio}
                    onRetry={teamRadio.refetch}
                  />
                </Suspense>
              )}

              {filters.tab === 'incidents' && (
                <Suspense fallback={<TabLoadingPlaceholder label="Loading race control view..." />}>
                  <IncidentsTab
                    loading={raceControl.loading}
                    error={raceControl.error}
                    messages={viewModel.raceControlMessages}
                    onRetry={raceControl.refetch}
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
                    weatherTrend={viewModel.weatherTrend}
                    embedMode={embedMode}
                    onEmbedPanel={onEmbedPanel}
                    onRetry={weather.refetch}
                  />
                </Suspense>
              )}

              {filters.tab === 'trackmap' && (
                <Suspense fallback={<TabLoadingPlaceholder label="Loading track map..." skeletonClassName="h-[260px] sm:h-[360px]" />}>
                <TrackMapTab
                  lapNum={filters.lapNum}
                  locationByDriver={locationByDriver}
                  locationLoading={locationLoading}
                  embedMode={embedMode}
                  onEmbedPanel={onEmbedPanel}
                />
                </Suspense>
              )}

              {filters.tab === 'positions' && (
                <Suspense fallback={<TabLoadingPlaceholder label="Loading race positions..." />}>
                  <PositionsTab
                    positions={positions.data}
                    positionsLoading={positions.loading}
                    embedMode={embedMode}
                    onEmbedPanel={onEmbedPanel}
                  />
                </Suspense>
              )}

              {filters.tab === 'intervals' && (
                <Suspense fallback={<TabLoadingPlaceholder label="Loading interval data..." />}>
                  <IntervalsTab
                    intervals={intervals.data}
                    intervalsLoading={intervals.loading}
                    embedMode={embedMode}
                    onEmbedPanel={onEmbedPanel}
                  />
                </Suspense>
              )}

              {filters.tab === 'broadcast' && (
                <Suspense fallback={<TabLoadingPlaceholder label="Loading broadcast view..." />}>
                  <BroadcastTab
                    lapNum={filters.lapNum}
                    lapsLoading={lapsLoading}
                    sectorRows={viewModel.sectorRows}
                    lapSummaries={viewModel.lapSummaries}
                    gapCards={gapCards}
                    sessionTitle={embedTitle}
                    embedMode={embedMode}
                    onEmbedPanel={onEmbedPanel}
                  />
                </Suspense>
              )}
            </div>
            </TabLeadContext.Provider>
          </ErrorBoundary>
          {!embedMode && <NextViews activeTab={filters.tab} onChange={filters.setTab} />}
        </main>
      </div>
      {!embedMode && <SiteFooter />}
    </div>
  );
}

const NO_LAPS: OpenF1Lap[] = [];

// ─── Year options constant (computed once at module load) ─────────────────────
const LAP_TABS: Tab[] = ['telemetry', 'energy', 'trackmap', 'broadcast'];
const YEAR_OPTIONS = Array.from(
  { length: new Date().getFullYear() - 2022 },
  (_, index) => 2023 + index,
);
