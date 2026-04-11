/**
 * DashboardShell — pure presentational component for the F1 dashboard.
 *
 * Receives all data and handlers as props; contains no hooks or side effects.
 * This separation makes the UI layer independently testable: render
 * DashboardShell with mock props without any API calls or router state.
 */

import { Suspense, lazy } from 'react';
import type { DashboardData } from '../hooks/useDashboard';
import type { Tab } from './dashboard/types';
import { TAB_LABELS } from './dashboard/tabLabels';
import { ErrorBoundary } from './ErrorBoundary';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardSelectors } from './dashboard/DashboardSelectors';
import { DashboardTabs } from './dashboard/DashboardTabs';
import { DriverSelector } from './dashboard/DriverSelector';
import { TelemetryTab } from './dashboard/TelemetryTab';
import { TrackMapTab } from './dashboard/TrackMapTab';
import { ChartSkeleton, Err } from './dashboard/shared';

// ─── Lazy-loaded tab chunks ───────────────────────────────────────────────────

const StrategyTab  = lazy(() => import('./dashboard/StrategyTab').then((m)  => ({ default: m.StrategyTab })));
const EnergyTab    = lazy(() => import('./dashboard/EnergyTab').then((m)    => ({ default: m.EnergyTab })));
const RadioTab     = lazy(() => import('./dashboard/RadioTab').then((m)     => ({ default: m.RadioTab })));
const IncidentsTab = lazy(() => import('./dashboard/IncidentsTab').then((m) => ({ default: m.IncidentsTab })));
const WeatherTab   = lazy(() => import('./dashboard/WeatherTab').then((m)   => ({ default: m.WeatherTab })));
const PositionsTab = lazy(() => import('./dashboard/PositionsTab').then((m) => ({ default: m.PositionsTab })));
const IntervalsTab = lazy(() => import('./dashboard/IntervalsTab').then((m) => ({ default: m.IntervalsTab })));
const BroadcastTab = lazy(() => import('./dashboard/BroadcastTab').then((m) => ({ default: m.BroadcastTab })));

function TabLoadingPlaceholder({ label }: { label: string }) {
  return (
    <div className="dashboard-panel rounded-[16px] p-6 text-sm text-[color:var(--text-muted)] sm:rounded-[18px] sm:p-8">
      <ChartSkeleton label={label} className="h-32" />
    </div>
  );
}

// ─── Chip/pill types ──────────────────────────────────────────────────────────

export type SummaryPill = {
  label: string;
  driver: string;
  detail: string;
  tone: 'blue' | 'purple';
};

export type QuickChip = {
  label: string;
  tone: 'purple' | 'amber' | 'blue' | 'neutral';
};

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
  summaryPills: SummaryPill[];
  quickChips: QuickChip[];
  embedTitle: string;
  embedSubtitle: string;
  embedContext: Array<{ label: string; value: string }>;
  openDashboardUrl: string;
  contentLayoutClass: string;
  pageShellClass: string;
  tabBoundaryResetKey: string;

  // ── Handlers ───────────────────────────────────────────────────────────
  onPresetNameChange: (name: string) => void;
  onSavePreset: () => void;
  onShare: () => Promise<void>;
  onShareTab: (tab: Tab) => Promise<void>;
  onEmbed: () => Promise<void>;
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
  summaryPills,
  quickChips,
  embedTitle,
  embedSubtitle,
  embedContext,
  openDashboardUrl,
  contentLayoutClass,
  pageShellClass,
  tabBoundaryResetKey,
  onPresetNameChange,
  onSavePreset,
  onShare,
  onShareTab,
  onEmbed,
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
  } = data;

  return (
    <div
      className={[
        'dashboard-app',
        themeMode === 'light' ? 'theme-light' : 'theme-dark',
        embedMode ? 'embed-mode' : 'min-h-screen',
      ].filter(Boolean).join(' ')}
    >
      <div className={pageShellClass}>
        {!embedMode && (
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 z-50 rounded bg-white px-4 py-2 text-sm font-semibold text-black shadow-lg"
          >
            Skip to content
          </a>
        )}

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
          onPresetNameChange={onPresetNameChange}
          onSavePreset={onSavePreset}
          onShare={onShare}
          onEmbed={onEmbed}
          onPrint={onPrint}
          onToggleSplit={onToggleSplit}
          onToggleTheme={onToggleTheme}
          onBack={onBack}
        />

        <main id="main-content" tabIndex={-1}>
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
            summaryPills={summaryPills}
            quickChips={quickChips}
            canStepBackward={canStepBackward}
            canStepForward={canStepForward}
            embedMode={embedMode}
            onYearChange={filters.handleYearChange}
            onCircuitChange={filters.handleCircuitChange}
            onSessionChange={filters.handleSessionChange}
            onLapChange={filters.setLapNum}
            onStepLap={stepLap}
          />

          {meetings.error   && <Err msg={`Failed to load calendar: ${meetings.error}`}   onAction={meetings.refetch} />}
          {sessions.error   && <Err msg={`Failed to load sessions: ${sessions.error}`}   onAction={sessions.refetch} />}
          {drivers.error    && <Err msg={`Failed to load drivers: ${drivers.error}`}     onAction={drivers.refetch} />}

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
            onShareTab={onShareTab}
            onEmbedTab={onEmbedTab}
          />

          <ErrorBoundary label={TAB_LABELS[filters.tab]} resetKey={tabBoundaryResetKey}>
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
                  embedMode={embedMode}
                  onEmbedPanel={onEmbedPanel}
                  onTelemetryRetry={primaryTelemetry?.refetch}
                />
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
                    weatherRadar={viewModel.weatherRadar}
                    weatherTrend={viewModel.weatherTrend}
                    embedMode={embedMode}
                    onEmbedPanel={onEmbedPanel}
                    onRetry={weather.refetch}
                  />
                </Suspense>
              )}

              {filters.tab === 'trackmap' && (
                <TrackMapTab
                  lapNum={filters.lapNum}
                  locationByDriver={locationByDriver}
                  locationLoading={locationLoading}
                  embedMode={embedMode}
                  onEmbedPanel={onEmbedPanel}
                />
              )}

              {filters.tab === 'positions' && (
                <Suspense fallback={<TabLoadingPlaceholder label="Loading race positions..." />}>
                  <PositionsTab
                    positions={positions.data}
                    positionsLoading={positions.loading}
                    lapNum={filters.lapNum}
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
                    driverMap={selectionData.driverMap}
                    embedMode={embedMode}
                    onEmbedPanel={onEmbedPanel}
                  />
                </Suspense>
              )}
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

// ─── Year options constant (computed once at module load) ─────────────────────
const YEAR_OPTIONS = Array.from(
  { length: new Date().getFullYear() - 2022 },
  (_, index) => 2023 + index,
);
