import { describe, it, expect } from 'vitest';
import { buildNormalizedComparisonData, summarizeTelemetry } from '../useDashboardViewModel';
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
  it('uses the sample-based trace when only one driver is selected', () => {
    const telemetry = { 44: makeSamples(50, 44) };
    const result = buildNormalizedComparisonData([44], telemetry, () => {});
    expect(result).toHaveLength(0);
  });

  it('returns empty array when no drivers provided', () => {
    const result = buildNormalizedComparisonData([], {}, () => {});
    expect(result).toHaveLength(0);
  });

  it('keeps the second driver when the primary driver has no telemetry samples', () => {
    const telemetry = { 44: [], 1: makeSamples(50, 1) };
    const result = buildNormalizedComparisonData([44, 1], telemetry, (point, number, sample) => {
      point[`speed_${number}`] = sample?.speed;
    });
    expect(result).toHaveLength(120);
    expect(result[0]).toEqual({ progress: 0, speed_1: 200 });
    expect(result[119]).toEqual({ progress: 100, speed_1: 249 });
  });

  it('returns no comparison when every driver is unavailable', () => {
    const result = buildNormalizedComparisonData([44, 1], { 44: [], 1: null }, () => {});
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

describe('summarizeTelemetry', () => {
  const sample = (speed: number, throttle: number, brake: number, rpm: number, n_gear: number, drs: number) =>
    ({ date: '2025-01-01T00:00:00Z', driver_number: 1, speed, throttle, brake, n_gear, rpm, drs, session_key: 1, meeting_key: 1 });

  it('matches the separate-pass formulas it replaced', () => {
    const laps = [sample(300, 100, 0, 11000, 8, 12), sample(120, 10, 100, 9000, 3, 0), sample(250, 60, 0, 12500, 7, 10), sample(90, 0, 100, 8000, 2, 8)];
    expect(summarizeTelemetry(laps)).toEqual({
      topSpeed: Math.max(...laps.map((e) => e.speed)),
      avgThrottle: laps.reduce((sum, e) => sum + e.throttle, 0) / laps.length,
      avgBrake: laps.reduce((sum, e) => sum + e.brake, 0) / laps.length,
      peakRpm: 12500,
      peakGear: 8,
      drsOpenPct: Math.round((laps.filter((e) => e.drs >= 10).length / laps.length) * 100),
    });
  });

  it('is all null without samples', () => {
    expect(summarizeTelemetry([])).toEqual({ topSpeed: null, avgThrottle: null, avgBrake: null, peakRpm: null, peakGear: null, drsOpenPct: null });
  });
});
