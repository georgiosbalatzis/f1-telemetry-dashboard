/**
 * useDashboard — unified data hook for the F1 Telemetry Dashboard.
 *
 * Composes the three domain-specific hooks (filters → selectionData → viewModel)
 * together with all API data fetching, so callers deal with a single entry point
 * rather than orchestrating six+ hooks manually.
 *
 * Sub-hooks (useDashboardFilters, useDashboardSelectionData, useDashboardViewModel)
 * are @internal — prefer useDashboard for all production use.
 */

import { useCallback, useMemo } from 'react';
import { useDashboardFilters } from './useDashboardFilters';
import { useDashboardSelectionData } from './useDashboardSelectionData';
import { useDashboardViewModel } from './useDashboardViewModel';
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
} from './useOpenF1';

/** Maximum number of simultaneously-compared drivers. */
const MAX_DRIVER_SLOTS = 4;

export function useDashboard() {
  // ── Filter state (URL-synced) ────────────────────────────────────────────
  const filters = useDashboardFilters();

  // ── Tab-driven data-fetch flags ──────────────────────────────────────────
  const needsTelemetryData = filters.tab === 'telemetry' || filters.tab === 'energy';
  const needsStrategyData  = filters.tab === 'tires';
  const needsRadioData     = filters.tab === 'radio';
  const needsIncidentsData = filters.tab === 'incidents';
  const needsWeatherData   = filters.tab === 'weather';
  const needsLocationData  = filters.tab === 'trackmap';
  const needsPositionsData = filters.tab === 'positions';
  const needsIntervalsData = filters.tab === 'intervals';

  // ── Session-level API calls ──────────────────────────────────────────────
  const meetings      = useMeetings(filters.year);
  const sessions      = useSessions(filters.year, filters.circuit);
  const drivers       = useDrivers(filters.sessionKey);
  const sessionResults = useSessionResult(filters.sessionKey);
  const stints        = useStints(needsStrategyData  ? filters.sessionKey : null);
  const pits          = usePits(needsStrategyData     ? filters.sessionKey : null);
  const weather       = useWeather(needsWeatherData   ? filters.sessionKey : null);
  const raceControl   = useRaceControl(needsIncidentsData ? filters.sessionKey : null);
  const teamRadio     = useTeamRadio(needsRadioData   ? filters.sessionKey : null);
  const positions     = usePositions(needsPositionsData ? filters.sessionKey : null);
  const intervals     = useIntervals(needsIntervalsData  ? filters.sessionKey : null);

  // ── Per-driver slots (fixed length preserves Rules of Hooks) ────────────
  const driverSlots = useMemo(
    () =>
      Array.from(
        { length: MAX_DRIVER_SLOTS },
        (_, index) => filters.driverNums[index] ?? null,
      ),
    [filters.driverNums],
  );

  // ── Lap data — one hook per slot, null driver = skip ────────────────────
  const lapStates = [
    useLaps(filters.sessionKey, driverSlots[0]),
    useLaps(filters.sessionKey, driverSlots[1]),
    useLaps(filters.sessionKey, driverSlots[2]),
    useLaps(filters.sessionKey, driverSlots[3]),
  ];

  // ── Selection data: derives circuit/session/driver/lap options ───────────
  const selectionData = useDashboardSelectionData({
    meetings:              meetings.data,
    sessions:              sessions.data,
    drivers:               drivers.data,
    sessionResults:        sessionResults.data,
    sessionResultsLoading: sessionResults.loading,
    lapStates,
    circuit:               filters.circuit,
    sessionKey:            filters.sessionKey,
    driverNums:            filters.driverNums,
    lapNum:                filters.lapNum,
    driverSelectionAuto:   filters.driverSelectionAuto,
    lapSelectionAuto:      filters.lapSelectionAuto,
    setCircuit:            filters.setCircuit,
    setSessionKey:         filters.setSessionKey,
    setDriverNums:         filters.setAutoDriverNums,
    setLapNum:             filters.setAutoLapNum,
  });

  // ── Telemetry — windowed to the selected lap per driver ──────────────────
  const telemetryStates = [
    useLapTelemetry(
      filters.sessionKey, driverSlots[0],
      needsTelemetryData ? selectionData.telemetryWindows[0]?.lapStart     || null : null,
      needsTelemetryData ? selectionData.telemetryWindows[0]?.nextLapStart || null : null,
    ),
    useLapTelemetry(
      filters.sessionKey, driverSlots[1],
      needsTelemetryData ? selectionData.telemetryWindows[1]?.lapStart     || null : null,
      needsTelemetryData ? selectionData.telemetryWindows[1]?.nextLapStart || null : null,
    ),
    useLapTelemetry(
      filters.sessionKey, driverSlots[2],
      needsTelemetryData ? selectionData.telemetryWindows[2]?.lapStart     || null : null,
      needsTelemetryData ? selectionData.telemetryWindows[2]?.nextLapStart || null : null,
    ),
    useLapTelemetry(
      filters.sessionKey, driverSlots[3],
      needsTelemetryData ? selectionData.telemetryWindows[3]?.lapStart     || null : null,
      needsTelemetryData ? selectionData.telemetryWindows[3]?.nextLapStart || null : null,
    ),
  ];

  // ── GPS location — windowed to the selected lap per driver ───────────────
  const locationStates = [
    useLapLocation(needsLocationData ? filters.sessionKey : null, driverSlots[0], needsLocationData ? selectionData.telemetryWindows[0]?.lapStart || null : null, needsLocationData ? selectionData.telemetryWindows[0]?.nextLapStart || null : null),
    useLapLocation(needsLocationData ? filters.sessionKey : null, driverSlots[1], needsLocationData ? selectionData.telemetryWindows[1]?.lapStart || null : null, needsLocationData ? selectionData.telemetryWindows[1]?.nextLapStart || null : null),
    useLapLocation(needsLocationData ? filters.sessionKey : null, driverSlots[2], needsLocationData ? selectionData.telemetryWindows[2]?.lapStart || null : null, needsLocationData ? selectionData.telemetryWindows[2]?.nextLapStart || null : null),
    useLapLocation(needsLocationData ? filters.sessionKey : null, driverSlots[3], needsLocationData ? selectionData.telemetryWindows[3]?.lapStart || null : null, needsLocationData ? selectionData.telemetryWindows[3]?.nextLapStart || null : null),
  ];

  // ── Derived data structures ──────────────────────────────────────────────
  const locationByDriver = Object.fromEntries(
    filters.driverNums.map((driverNum, index) => [
      driverNum,
      locationStates[index]?.data || null,
    ]),
  ) as Record<number, ReturnType<typeof useLapLocation>['data']>;

  const telemetryByDriver = Object.fromEntries(
    filters.driverNums.map((driverNumber, index) => [
      driverNumber,
      telemetryStates[index]?.data || null,
    ]),
  ) as Record<number, ReturnType<typeof useLapTelemetry>['data']>;

  /** FetchState for the primary (first) driver's telemetry — used for error display. */
  const primaryTelemetry = telemetryStates[0];

  // ── View model: tab-gated data transformations for charts ────────────────
  const viewModel = useDashboardViewModel({
    activeTab:        filters.tab,
    allLaps:          selectionData.allLaps,
    driverMap:        selectionData.driverMap,
    driverNums:       filters.driverNums,
    lapNum:           filters.lapNum,
    lapOptions:       selectionData.lapOptions,
    stints:           stints.data,
    pits:             pits.data,
    weather:          weather.data,
    raceControl:      raceControl.data,
    teamRadio:        teamRadio.data,
    telemetryByDriver,
  });

  // ── Aggregate loading flags ──────────────────────────────────────────────
  const anyLoading       = meetings.loading || sessions.loading || drivers.loading || sessionResults.loading;
  const lapsLoading      = lapStates.some((s) => s.loading);
  const locationLoading  = needsLocationData && locationStates.some((s) => s.loading);
  const telemetryLoading = needsTelemetryData && telemetryStates.some((s) => s.loading);

  // ── Lap navigation ───────────────────────────────────────────────────────
  const totalLaps        = selectionData.lapOptions.length > 0
    ? selectionData.lapOptions[selectionData.lapOptions.length - 1]
    : null;
  const currentLapIndex  = selectionData.lapOptions.indexOf(filters.lapNum);
  const canStepBackward  = currentLapIndex > 0;
  const canStepForward   = currentLapIndex >= 0 && currentLapIndex < selectionData.lapOptions.length - 1;

  const stepLap = useCallback(
    (direction: -1 | 1) => {
      const nextLap = selectionData.lapOptions[currentLapIndex + direction];
      if (nextLap != null) filters.setLapNum(nextLap);
    },
    [currentLapIndex, filters, selectionData.lapOptions],
  );

  return {
    // Filter state + controls
    filters,

    // API fetch states (for error display, loading indicators, refetch)
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

    // Derived domain data
    selectionData,
    viewModel,
    locationByDriver,

    // Aggregate loading flags
    anyLoading,
    lapsLoading,
    locationLoading,
    telemetryLoading,

    // Lap navigation
    totalLaps,
    canStepBackward,
    canStepForward,
    stepLap,
  };
}

export type DashboardData = ReturnType<typeof useDashboard>;
