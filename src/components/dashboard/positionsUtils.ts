import type { OpenF1Position } from '../../api/openf1';

export const MAX_CHART_POINTS = 100;

export type PositionChartResult = {
  chartData: Record<string, number | string>[];
  totalLaps: number;
  driverCount: number;
};

/**
 * Converts raw OpenF1Position samples into time-bucketed chart data.
 * Each bucket picks the sample whose timestamp is closest to the bucket boundary.
 * An O(n) pointer-advance per driver avoids the naive O(n²) scan.
 */
export function buildPositionChartData(positions: OpenF1Position[]): PositionChartResult {
  if (positions.length === 0) return { chartData: [], totalLaps: 0, driverCount: 0 };

  type PositionSample = { position: number; timestamp: number };
  const byDriver = new Map<number, PositionSample[]>();
  let tMin = Number.POSITIVE_INFINITY;
  let tMax = Number.NEGATIVE_INFINITY;

  positions.forEach((entry) => {
    const timestamp = Date.parse(entry.date);
    if (!Number.isFinite(timestamp)) return;

    tMin = Math.min(tMin, timestamp);
    tMax = Math.max(tMax, timestamp);

    const samples = byDriver.get(entry.driver_number);
    const sample = { position: entry.position, timestamp };
    if (samples) {
      samples.push(sample);
    } else {
      byDriver.set(entry.driver_number, [sample]);
    }
  });

  const allDrivers = [...byDriver.keys()];
  if (allDrivers.length === 0 || !Number.isFinite(tMin) || !Number.isFinite(tMax)) {
    return { chartData: [], totalLaps: 0, driverCount: 0 };
  }

  byDriver.forEach((samples) => {
    samples.sort((left, right) => left.timestamp - right.timestamp);
  });

  const duration = tMax - tMin || 1;
  const bucketTimes = Array.from({ length: MAX_CHART_POINTS }, (_, index) => (
    tMin + (index / (MAX_CHART_POINTS - 1)) * duration
  ));
  const buckets = bucketTimes.map((_, index) => ({ t: index + 1 } as Record<string, number | string>));

  allDrivers.forEach((driverNumber) => {
    const samples = byDriver.get(driverNumber);
    if (!samples?.length) return;

    let pointer = 0;
    bucketTimes.forEach((bucketTime, bucketIndex) => {
      while (pointer + 1 < samples.length && samples[pointer + 1].timestamp <= bucketTime) {
        pointer += 1;
      }
      const current = samples[pointer];
      const next = samples[pointer + 1];
      const best = next && Math.abs(next.timestamp - bucketTime) < Math.abs(current.timestamp - bucketTime)
        ? next
        : current;
      buckets[bucketIndex][`p_${driverNumber}`] = best.position;
    });
  });

  const totalSamples = Math.max(0, ...allDrivers.map((n) => byDriver.get(n)?.length ?? 0));
  const estLaps = Math.round(totalSamples / 20);

  return { chartData: buckets, totalLaps: estLaps, driverCount: allDrivers.length };
}
