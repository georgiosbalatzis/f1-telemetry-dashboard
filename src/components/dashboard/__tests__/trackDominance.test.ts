import { expect, it } from 'vitest';
import { MINI_SECTORS, stretchPolylines, stretchWinners } from '../trackDominance';

/** A straight 1000-unit track sampled every 100 units; `times` are the seconds at which each sample is reached. */
const path = (times: number[]) => times.map((t, i) => ({ date: new Date(Date.UTC(2026, 0, 1, 12) + t * 1000).toISOString(), x: i * 100, y: 0 }));

it('gives each stretch to the driver who covered it quicker', () => {
  // A leads through the first half (5 s vs 6 s to the midpoint), B is quicker over the second half.
  const a = path([0, 1, 2, 3, 4, 5, 6.5, 8, 9.5, 11, 12.5]);
  const b = path([0, 1.2, 2.4, 3.6, 4.8, 6, 7, 8, 9, 10, 11]);
  const winners = stretchWinners({ 1: a, 2: b });
  expect(winners).toHaveLength(MINI_SECTORS);
  expect(winners[0]).toBe(1);
  expect(winners[MINI_SECTORS - 1]).toBe(2);
});

it('needs two drivers with usable paths', () => {
  expect(stretchWinners({ 1: path([0, 1, 2]) })).toEqual([]);
  expect(stretchWinners({ 1: path([0, 1, 2]), 2: [] })).toEqual([]);
});

it('cuts a drawn path into equal stretches that join up', () => {
  const lines = stretchPolylines([{ nx: 0, ny: 0 }, { nx: 100, ny: 0 }], 4);
  expect(lines).toEqual(['0.0,0.0 25.0,0.0', '25.0,0.0 50.0,0.0', '50.0,0.0 75.0,0.0', '75.0,0.0 100.0,0.0']);
});
