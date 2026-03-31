import { useMemo } from 'react';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
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

export default function F1TelemetryDashboard() {
  const filters = useDashboardFilters();

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
  const yearOptions = useMemo(
    () => Array.from({ length: new Date().getFullYear() - 2022 }, (_, index) => 2023 + index),
    [],
  );

  return (
    <div className="min-h-screen bg-[#0a0a14] text-gray-200 selection:bg-red-600/30">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/2 h-[800px] w-[800px] rounded-full bg-red-600/[0.03] blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/[0.02] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
        <DashboardHeader loading={anyLoading} />

        <DashboardSelectors
          year={filters.year}
          circuit={filters.circuit}
          sessionKey={filters.sessionKey}
          lapNum={filters.lapNum}
          yearOptions={yearOptions}
          circuitOptions={selectionData.circuitOptions}
          sessionOptions={selectionData.sessionOptions}
          lapOptions={selectionData.lapOptions}
          meetingsLoading={meetings.loading}
          sessionsLoading={sessions.loading}
          lapsLoading={lapsLoading}
          onYearChange={filters.handleYearChange}
          onCircuitChange={filters.handleCircuitChange}
          onSessionChange={filters.handleSessionChange}
          onLapChange={filters.setLapNum}
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

        <div className="space-y-6 pb-16">
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
