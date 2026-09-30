import { expect, it } from 'vitest';
import { computeCornerSplits, type LapTrace } from '../cornerSplits';

/** A lap of 20 s at 0.1 s samples: slow first half (100 km/h), fast second half (300 km/h), scaled by `pace`. */
function trace(pace: number, lapTime: number, slow = 100, fast = 300): LapTrace {
  const samples = Array.from({ length: 201 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 0, 1, 12, 0, 0) + i * 100).toISOString(),
    speed: (i < 100 ? slow : fast) * pace,
  }));
  return { samples, lapTime };
}

it('adds the three parts up to the lap-time gap', () => {
  const splits = computeCornerSplits(trace(1, 90), trace(0.98, 90.4)) as NonNullable<ReturnType<typeof computeCornerSplits>>;
  expect(splits.slow + splits.medium + splits.fast).toBeCloseTo(0.4, 2);
});

it('puts the loss where the target was slower', () => {
  // Target matches the reference on the fast stretch but is 10 km/h down on the slow one.
  const splits = computeCornerSplits(trace(1, 100), { ...trace(1, 100, 90, 300), lapTime: 105 }) as NonNullable<ReturnType<typeof computeCornerSplits>>;
  expect(splits.slow).toBeGreaterThan(3);
  expect(Math.abs(splits.fast)).toBeLessThan(splits.slow);
});

it('returns null without usable samples', () => {
  expect(computeCornerSplits(trace(1, 90), { samples: [], lapTime: 90 })).toBeNull();
});
