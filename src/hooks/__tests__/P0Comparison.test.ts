import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor, act } from '@testing-library/react';
import * as api from '../../api/openf1';
import { useDashboard } from '../useDashboard';

const lap: api.OpenF1Lap = {
  date_start: '2024-03-02T15:00:00Z', driver_number: 12, lap_number: 3,
  lap_duration: 96, duration_sector_1: 29, duration_sector_2: 35, duration_sector_3: 32,
  st_speed: 294, i1_speed: 290, i2_speed: 280, is_pit_out_lap: false,
  segments_sector_1: [], segments_sector_2: [], segments_sector_3: [], session_key: 99999, meeting_key: 1,
};
const sample: api.OpenF1CarData = {
  date: lap.date_start, driver_number: 12, speed: 329, throttle: 90, brake: 0,
  n_gear: 8, rpm: 11000, drs: 12, session_key: 99999, meeting_key: 1,
};
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('preserves Broadcast measurements and exposes secondary failures with working retries', async () => {
  window.history.replaceState({}, '', '/?year=2024&circuit=Bahrain&session=99999&drivers=12,3,63,1&lap=3&tab=telemetry');
  vi.spyOn(api, 'getMeetings').mockResolvedValue([]);
  vi.spyOn(api, 'getSessionsByCircuit').mockResolvedValue([]);
  vi.spyOn(api, 'getDrivers').mockResolvedValue([]);
  vi.spyOn(api, 'getSessionResult').mockResolvedValue([]);
  let failing = true;
  vi.spyOn(api, 'getLaps').mockImplementation(async (_, driver) => {
    if (failing && (driver === 63 || driver === 1)) throw new Error('HTTP 429');
    return [{ ...lap, driver_number: driver }];
  });
  const telemetry = vi.spyOn(api, 'getCarDataForLap').mockResolvedValue([sample]);
  const { result } = renderHook(() => useDashboard());
  await waitFor(() => expect(result.current.comparisonDrivers.filter(d => d.status === 'Loaded')).toHaveLength(2));
  expect(result.current.comparisonDrivers.slice(2).map(d => d.status)).toEqual(['Lap request failed', 'Lap request failed']);
  const sectors = result.current.viewModel.sectorRows;
  act(() => result.current.filters.setTab('broadcast'));
  expect(result.current.viewModel.sectorRows).toEqual(sectors);
  expect(result.current.viewModel.lapSummaries[0]).toMatchObject({ topSpeed: 329, avgThrottle: 90, drsOpenPct: 100 });
  failing = false;
  act(() => result.current.comparisonDrivers.slice(2).forEach(d => d.retry?.()));
  await waitFor(() => expect(result.current.comparisonDrivers.every(d => d.status === 'Loaded')).toBe(true));
  expect(telemetry).toHaveBeenCalledTimes(4);
});
