import { expect, it } from 'vitest';
import { buildGapCards } from '../gapCardData';
import type { DriverLapSummary, SectorRow } from '../types';

const summary = (driverNumber: number, name: string, lapTime: number | null) => ({ driverNumber, name, lapTime, topSpeed: 330, color: '#fff' }) as DriverLapSummary;
const row = (name: string, s1: number, s2: number, s3: number) => ({ name, color: '#fff', s1, s2, s3 }) as SectorRow;

it('builds a card per slower driver with the gap, sector deltas and the reference splits', () => {
  const cards = buildGapCards(
    [summary(63, 'RUS', 104.916), summary(1, 'VER', 105.02)],
    [row('RUS', 37.056, 42.656, 25.204), row('VER', 37.169, 43.101, 24.75)],
    { reference: 63, byDriver: { 1: { slow: 0.3, medium: 0.05, fast: -0.246 } } },
  );
  expect(cards).toHaveLength(1);
  expect(cards[0].reference).toBe('RUS');
  expect(cards[0].gap).toBeCloseTo(0.104, 3);
  expect(cards[0].sectors.map((value) => value?.toFixed(3))).toEqual(['0.113', '0.445', '-0.454']);
  expect(cards[0].splits?.slow).toBe(0.3);
});

it('needs two timed laps and ignores splits computed against another reference', () => {
  expect(buildGapCards([summary(1, 'VER', 105), summary(63, 'RUS', null)], [], null)).toEqual([]);
  const [card] = buildGapCards([summary(63, 'RUS', 104), summary(1, 'VER', 105)], [], { reference: 1, byDriver: { 63: { slow: 1, medium: 0, fast: 0 } } });
  expect(card.splits).toBeNull();
});
