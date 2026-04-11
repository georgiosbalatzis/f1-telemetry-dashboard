import { describe, it, expect } from 'vitest';
import { buildNormalizedComparisonData } from '../useDashboardViewModel';
import type { OpenF1CarData } from '../../api/openf1';

function makeSamples(count: number, driverNumber: number): OpenF1CarData[] {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(Date.UTC(2024, 0, 1, 0, 0, i)).toISOString(),
    driver_number: driverNumber,
    speed: 200 + i,
    throttle: 80,
    brake: 0,
    n_gear: 7,
    rpm: 10000,
    drs: 0,
    session_key: 9158,
    meeting_key: 1234,
  }));
}

describe('buildNormalizedComparisonData', () => {
  it('returns empty array when fewer than 2 active drivers', () => {
    const telemetry = { 44: makeSamples(50, 44) };
    const result = buildNormalizedComparisonData([44], telemetry, () => {});
    expect(result).toHaveLength(0);
  });

  it('returns empty array when no drivers provided', () => {
    const result = buildNormalizedComparisonData([], {}, () => {});
    expect(result).toHaveLength(0);
  });

  it('returns empty array when a driver has no telemetry samples', () => {
    const telemetry = { 44: makeSamples(50, 44), 1: [] };
    const result = buildNormalizedComparisonData([44, 1], telemetry, () => {});
    expect(result).toHaveLength(0);
  });

  it('returns 120 evenly-spaced points for 2 active drivers', () => {
    const telemetry = {
      44: makeSamples(200, 44),
      1:  makeSamples(180, 1),
    };
    const result = buildNormalizedComparisonData([44, 1], telemetry, () => {});
    expect(result).toHaveLength(120);
  });

  it('first point has progress 0 and last has progress 100', () => {
    const telemetry = {
      44: makeSamples(200, 44),
      1:  makeSamples(200, 1),
    };
    const result = buildNormalizedComparisonData([44, 1], telemetry, () => {});
    expect(result[0]?.progress).toBe(0);
    expect(result[119]?.progress).toBe(100);
  });

  it('calls assignSample for each driver at each point', () => {
    const telemetry = {
      44: makeSamples(120, 44),
      1:  makeSamples(120, 1),
    };
    const calls: Array<{ driverNumber: number }> = [];
    buildNormalizedComparisonData([44, 1], telemetry, (_, driverNumber) => {
      calls.push({ driverNumber });
    });
    // 120 points × 2 drivers = 240 calls
    expect(calls).toHaveLength(240);
  });
});
