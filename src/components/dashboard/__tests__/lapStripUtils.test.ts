import { expect, it } from 'vitest';
import type { OpenF1Lap, OpenF1RaceControl } from '../../../api/openf1';
import { lapBars, safetyCarLaps } from '../lapStripUtils';

const rc = (date: string, message: string, lap_number: number | null) => ({ date, category: 'SafetyCar', message, lap_number }) as OpenF1RaceControl;
const lap = (lap_number: number, lap_duration: number | null, is_pit_out_lap = false) => ({ lap_number, lap_duration, is_pit_out_lap }) as OpenF1Lap;

it('turns deployed/ending messages into lap ranges, closing an open period at the last lap', () => {
  const closed = safetyCarLaps([rc('2026-01-01T10:00', 'SAFETY CAR DEPLOYED', 30), rc('2026-01-01T10:10', 'SAFETY CAR IN THIS LAP', 33)], 51);
  expect([...closed]).toEqual([30, 31, 32, 33]);
  expect([...safetyCarLaps([rc('2026-01-01T10:00', 'VIRTUAL SAFETY CAR DEPLOYED', 49)], 51)]).toEqual([49, 50, 51]);
  expect(safetyCarLaps(null, 51).size).toBe(0);
});

it('draws quicker laps taller and marks safety-car, pit and missing laps', () => {
  const bars = lapBars([lap(1, 110), lap(2, 100), lap(3, 101), lap(4, 160), lap(5, 120, true), lap(6, null)], new Set([4]));
  const byLap = Object.fromEntries(bars.map((bar) => [bar.lap, bar]));
  expect(byLap[2].height).toBe(100);
  expect(byLap[2].height).toBeGreaterThan(byLap[1].height);
  expect(byLap[4].state).toBe('sc');
  expect(byLap[4].height).toBe(18);
  expect(byLap[4].height).toBeLessThan(byLap[3].height);
  expect(byLap[5].state).toBe('normal');
  expect(byLap[6].state).toBe('missing');
  expect(lapBars([lap(1, null)], new Set())).toEqual([]);
});

it('marks the lap before a pit-out lap as the pit lap', () => {
  const bars = lapBars([lap(10, 100), lap(11, 125), lap(12, 122, true)], new Set());
  expect(bars.find((bar) => bar.lap === 11)?.state).toBe('pit');
});
