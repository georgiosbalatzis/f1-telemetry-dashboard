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
import { useDebouncedValue } from './useDebouncedValue';
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

/** Quiet time before a manually stepped lap starts fetching its telemetry and GPS (auto-picked laps fetch at once). */
const LAP_FETCH_DEBOUNCE_MS = 200;

/** Maximum number of simultaneously-compared drivers. */
const MAX_DRIVER_SLOTS = 4;

export function useDashboard() {
  // ── Filter state (URL-synced) ────────────────────────────────────────────
  const filters = useDashboardFilters();

  // ── Tab-driven data-fetch flags ──────────────────────────────────────────
  const needsTelemetryData = filters.tab === 'telemetry' || filters.tab === 'energy' || filters.tab === 'broadcast';
  const needsStrategyData  = filters.tab === 'tires';
  const needsRadioData     = filters.tab === 'radio';
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
  // Arrays are memoized so downstream memos/effects only see a change when a slot's state really changed.
  const laps0 = useLaps(filters.sessionKey, driverSlots[0]);
  const laps1 = useLaps(filters.sessionKey, driverSlots[1]);
  const laps2 = useLaps(filters.sessionKey, driverSlots[2]);
  const laps3 = useLaps(filters.sessionKey, driverSlots[3]);
  const lapStates = useMemo(() => [laps0, laps1, laps2, laps3], [laps0, laps1, laps2, laps3]);
  const lapData = useMemo(() => [laps0.data, laps1.data, laps2.data, laps3.data], [laps0.data, laps1.data, laps2.data, laps3.data]);

  // The UI lap updates instantly; heavy per-lap fetches wait until the user stops stepping.
  const windowLapNum = useDebouncedValue(filters.lapNum, filters.lapSelectionAuto ? 0 : LAP_FETCH_DEBOUNCE_MS);

  // ── Selection data: derives circuit/session/driver/lap options ───────────
  const selectionData = useDashboardSelectionData({
    meetings:              meetings.data,
    sessions:              sessions.data,
    drivers:               drivers.data,
    sessionResults:        sessionResults.data,
    sessionResultsLoading: sessionResults.loading,
    lapData,
    circuit:               filters.circuit,
    sessionKey:            filters.sessionKey,
    driverNums:            filters.driverNums,
    lapNum:                filters.lapNum,
    windowLapNum,
    driverSelectionAuto:   filters.driverSelectionAuto,
    lapSelectionAuto:      filters.lapSelectionAuto,
    setCircuit:            filters.setCircuit,
    setSessionKey:         filters.setSessionKey,
    setDriverNums:         filters.setAutoDriverNums,
    setLapNum:             filters.setAutoLapNum,
  });

  // ── Telemetry — windowed to the selected lap per driver ──────────────────
  const windows = selectionData.telemetryWindows;
  const win = (index: number) => ({
    start: needsTelemetryData ? windows[index]?.lapStart     || null : null,
    next:  needsTelemetryData ? windows[index]?.nextLapStart || null : null,
  });
  const telem0 = useLapTelemetry(filters.sessionKey, driverSlots[0], win(0).start, win(0).next);
  const telem1 = useLapTelemetry(filters.sessionKey, driverSlots[1], win(1).start, win(1).next);
  const telem2 = useLapTelemetry(filters.sessionKey, driverSlots[2], win(2).start, win(2).next);
  const telem3 = useLapTelemetry(filters.sessionKey, driverSlots[3], win(3).start, win(3).next);
  const telemetryStates = useMemo(() => [telem0, telem1, telem2, telem3], [telem0, telem1, telem2, telem3]);

  // Only the lap-strip safety-car shading and the Race Control tab use this. It waits until laps have arrived and is
  // declared after the car-data hooks, so in that same commit car data is queued first (effects run in hook order).
  const lapsArrived = lapData.some((laps) => laps !== null);
  const raceControl = useRaceControl(filters.tab === 'incidents' || lapsArrived ? filters.sessionKey : null);

  // ── GPS location — windowed to the selected lap per driver ───────────────
  const locKey = needsLocationData ? filters.sessionKey : null;
  const locWin = (index: number) => ({
    start: needsLocationData ? windows[index]?.lapStart     || null : null,
    next:  needsLocationData ? windows[index]?.nextLapStart || null : null,
  });
  const loc0 = useLapLocation(locKey, driverSlots[0], locWin(0).start, locWin(0).next);
  const loc1 = useLapLocation(locKey, driverSlots[1], locWin(1).start, locWin(1).next);
  const loc2 = useLapLocation(locKey, driverSlots[2], locWin(2).start, locWin(2).next);
  const loc3 = useLapLocation(locKey, driverSlots[3], locWin(3).start, locWin(3).next);
  const locationStates = useMemo(() => [loc0, loc1, loc2, loc3], [loc0, loc1, loc2, loc3]);

  // ── Derived data structures ──────────────────────────────────────────────
  const locationData = useMemo(() => [loc0.data, loc1.data, loc2.data, loc3.data], [loc0.data, loc1.data, loc2.data, loc3.data]);
  const locationByDriver = useMemo(
    () => Object.fromEntries(
      filters.driverNums.map((driverNum, index) => [driverNum, locationData[index] || null]),
    ) as Record<number, ReturnType<typeof useLapLocation>['data']>,
    [filters.driverNums, locationData],
  );

  const telemetryData = useMemo(() => [telem0.data, telem1.data, telem2.data, telem3.data], [telem0.data, telem1.data, telem2.data, telem3.data]);
  const telemetryByDriver = useMemo(
    () => Object.fromEntries(
      filters.driverNums.map((driverNumber, index) => [driverNumber, telemetryData[index] || null]),
    ) as Record<number, ReturnType<typeof useLapTelemetry>['data']>,
    [filters.driverNums, telemetryData],
  );

  /** FetchState for the primary (first) driver's telemetry — used for error display. */
  const primaryTelemetry = telem0;

  const driverMap = selectionData.driverMap;
  const comparisonDrivers = useMemo(() => needsTelemetryData ? filters.driverNums.map((driverNumber, index) => {
    const laps = lapStates[index];
    const telemetry = telemetryStates[index];
    const lap = laps.data?.find((entry) => entry.lap_number === filters.lapNum);
    const status = laps.loading ? 'Loading lap data…'
      : laps.error ? 'Lap request failed'
      : !lap ? 'No data for this lap'
      : telemetry.loading ? 'Loading telemetry…'
      : telemetry.error ? 'Telemetry request failed'
      : !telemetry.data?.length ? 'No telemetry for this lap'
      : 'Loaded';
    return {
      driverNumber,
      name: driverMap[driverNumber]?.name_acronym || `#${driverNumber}`,
      status,
      /** False until the driver roster has loaded (the name is then only a #number). */
      known: driverMap[driverNumber] !== undefined,
      /** Still fetching: not a failure, so the band shows no "partial data" line for it. */
      // Includes "not requested yet" (the render before the fetch effects run), which is not a failure either.
      loading: laps.loading || (!laps.error && laps.data === null)
        || (!laps.error && !!lap && (telemetry.loading || (telemetry.data === null && !telemetry.error && !!windows[index]?.lapStart))),
      retry: laps.error ? laps.refetch : telemetry.error ? telemetry.refetch : null,
    };
  }) : [], [driverMap, filters.driverNums, filters.lapNum, lapStates, needsTelemetryData, telemetryStates, windows]);

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

  // ── Pending flags: the scope bar's driver row and the lap strip reserve their space until data arrives ──────
  // "Pending" ends as soon as the data is there or it is clear it never will be (empty or failed responses).
  const nothingToLoad = Boolean(meetings.error || sessions.error || drivers.error)
    || meetings.data?.length === 0 || sessions.data?.length === 0 || drivers.data?.length === 0;
  const driversPending = !nothingToLoad && drivers.data === null;
  const lapsPending = !nothingToLoad && laps0.data === null && laps0.error === null;

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

  return useMemo(() => ({
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
    telemetryByDriver,
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
    expectsDrivers: needsTelemetryData,
  }), [
    filters, meetings, sessions, drivers, stints, pits, weather, raceControl, teamRadio, positions, intervals, primaryTelemetry, telemetryByDriver, comparisonDrivers, selectionData, viewModel, locationByDriver, anyLoading, lapsLoading, locationLoading, telemetryLoading, totalLaps, canStepBackward, canStepForward, stepLap, driversPending, lapsPending, needsTelemetryData,
  ]);
}

export type DashboardData = ReturnType<typeof useDashboard>;
