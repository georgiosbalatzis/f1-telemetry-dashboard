import { describe, it, expect } from 'vitest';
import { buildPositionChartData, MAX_CHART_POINTS, nearestPerBucket } from '../positionsUtils';
import type { OpenF1Position } from '../../../api/openf1';

function makePosition(driverNumber: number, position: number, isoDate: string): OpenF1Position {
  return {
    driver_number: driverNumber,
    position,
    date: isoDate,
    session_key: 9158,
    meeting_key: 1234,
  };
}

// Generates N evenly spaced positions for one driver over a 10-minute window
function makePositionSeries(driverNumber: number, count: number, startIso: string): OpenF1Position[] {
  const startMs = Date.parse(startIso);
  return Array.from({ length: count }, (_, i) => ({
    driver_number: driverNumber,
    position: (i % 20) + 1,
    date: new Date(startMs + i * 6000).toISOString(), // one every 6 s
    session_key: 9158,
    meeting_key: 1234,
  }));
}

describe('buildPositionChartData', () => {
  it('returns empty result for empty input', () => {
    const result = buildPositionChartData([]);
    expect(result.chartData).toHaveLength(0);
    expect(result.totalLaps).toBe(0);
    expect(result.driverCount).toBe(0);
  });

  it('returns empty result for positions with invalid dates', () => {
    const positions: OpenF1Position[] = [
      { driver_number: 44, position: 1, date: 'not-a-date', session_key: 1, meeting_key: 1 },
    ];
    const result = buildPositionChartData(positions);
    expect(result.chartData).toHaveLength(0);
  });

  it(`produces exactly ${MAX_CHART_POINTS} buckets for a single driver`, () => {
    const positions = makePositionSeries(44, 200, '2024-06-01T12:00:00Z');
    const result = buildPositionChartData(positions);
    expect(result.chartData).toHaveLength(MAX_CHART_POINTS);
    expect(result.driverCount).toBe(1);
  });

  it('each bucket has a sequential `t` index starting at 1', () => {
    const positions = makePositionSeries(44, 50, '2024-06-01T12:00:00Z');
    const { chartData } = buildPositionChartData(positions);
    chartData.forEach((bucket, i) => {
      expect(bucket['t']).toBe(i + 1);
    });
  });

  it('assigns position values under `p_{driverNumber}` keys', () => {
    const positions = makePositionSeries(44, 100, '2024-06-01T12:00:00Z');
    const { chartData } = buildPositionChartData(positions);
    chartData.forEach((bucket) => {
      expect(bucket).toHaveProperty('p_44');
      expect(typeof bucket['p_44']).toBe('number');
    });
  });

  it('handles two drivers independently in the same bucket array', () => {
    const p44 = makePositionSeries(44, 100, '2024-06-01T12:00:00Z');
    const p1  = makePositionSeries(1,  100, '2024-06-01T12:00:00Z');
    const { chartData, driverCount } = buildPositionChartData([...p44, ...p1]);
    expect(driverCount).toBe(2);
    chartData.forEach((bucket) => {
      expect(bucket).toHaveProperty('p_44');
      expect(bucket).toHaveProperty('p_1');
    });
  });

  it('pointer never goes backwards — latest bucket picks nearest sample', () => {
    // Two samples: one at t=0, one at t=1000ms
    const t0 = '2024-06-01T12:00:00.000Z';
    const t1 = '2024-06-01T12:00:01.000Z';
    const positions = [
      makePosition(44, 3, t0),
      makePosition(44, 1, t1),
    ];
    const { chartData } = buildPositionChartData(positions);
    // First bucket should be closest to t0 → position 3
    expect(chartData[0]?.['p_44']).toBe(3);
    // Last bucket should be closest to t1 → position 1
    expect(chartData[MAX_CHART_POINTS - 1]?.['p_44']).toBe(1);
  });
});

describe('nearestPerBucket', () => {
  // The scan Intervals used before: every sample per bucket, strictly-closer wins, first of equals wins.
  const naive = (timestamps: number[], bucketTimes: number[]) => bucketTimes.map((t) => {
    let best = 0;
    let bestDiff = Infinity;
    timestamps.forEach((ts, index) => {
      const diff = Math.abs(ts - t);
      if (diff < bestDiff) { bestDiff = diff; best = index; }
    });
    return best;
  });

  it('picks the same samples as a full scan for sorted, distinct timestamps', () => {
    let seed = 7;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let round = 0; round < 25; round += 1) {
      const count = 1 + Math.floor(random() * 60);
      const timestamps = [...new Set(Array.from({ length: count }, () => Math.floor(random() * 10_000)))].sort((a, b) => a - b);
      const samples = timestamps.map((timestamp, index) => ({ timestamp, index }));
      const buckets = Array.from({ length: 40 }, (_, i) => (i / 39) * 10_000);
      expect(nearestPerBucket(samples, buckets).map((sample) => sample.index)).toEqual(naive(timestamps, buckets));
    }
  });
});
