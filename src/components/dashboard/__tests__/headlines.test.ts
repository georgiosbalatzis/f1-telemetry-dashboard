import { expect, it } from 'vitest';
import type { OpenF1Position, OpenF1Stint } from '../../../api/openf1';
import type { GapCardData } from '../gapCardData';
import { buildHeadline, type HeadlineContext } from '../headlines';
import type { DriverLapSummary } from '../types';

const names: Record<number, string> = { 63: 'Russell', 1: 'Verstappen', 4: 'Norris' };
const card = (over: Partial<GapCardData> = {}): GapCardData => ({
  driverNumber: 1, target: 'VER', reference: 'RUS', referenceNumber: 63, gap: 0.104, lapTime: 105.02, topSpeed: 333,
  sectors: [0.113, 0.445, -0.454], splits: { slow: 0.3, medium: 0.05, fast: -0.246 }, ...over,
});
const ctx = (over: Partial<HeadlineContext> = {}): HeadlineContext => ({
  lapNum: 49, driverNums: [63, 1], nameOf: (n) => names[n], gapCards: [card()], stintsByDriver: {}, positions: null,
  summaries: [{ driverNumber: 63, topSpeed: 326 }, { driverNumber: 1, topSpeed: 333 }] as DriverLapSummary[], ...over,
});
const stint = (driver_number: number, stint_number: number, compound: string) => ({ driver_number, stint_number, compound }) as OpenF1Stint;

it('names where the time came from when each driver wins a different kind of track', () => {
  const headline = buildHeadline('telemetry', ctx());
  expect(headline?.title).toBe('Ο Russell κερδίζει στις αργές στροφές, ο Verstappen στις ευθείες');
  expect(headline?.lede).toContain('Το sector 3 έκρινε τον γύρο (−0.454s)');
  expect(headline?.lede).toContain('Ο Verstappen έφτασε τα 333 km/h, 7 περισσότερα');
});

it('falls back to the winner and the gap, and to a tie under a millisecond', () => {
  expect(buildHeadline('telemetry', ctx({ gapCards: [card({ splits: null })] }))?.title).toBe('Ο Russell ήταν ταχύτερος κατά 0.104s');
  expect(buildHeadline('broadcast', ctx({ gapCards: [card({ gap: 0.0004 })] }))?.title).toContain('Ισοπαλία στον γύρο 49');
});

it('returns null when there is nothing to compare or the tab has no headline', () => {
  expect(buildHeadline('telemetry', ctx({ gapCards: [] }))).toBeNull();
  expect(buildHeadline('weather', ctx())).toBeNull();
  expect(buildHeadline('tires', ctx())).toBeNull();
  expect(buildHeadline('positions', ctx())).toBeNull();
});

it('summarises stops per driver', () => {
  const stints = { 63: [stint(63, 1, 'MEDIUM'), stint(63, 2, 'HARD')], 1: [stint(1, 1, 'MEDIUM'), stint(1, 2, 'HARD'), stint(1, 3, 'SOFT')] };
  const headline = buildHeadline('tires', ctx({ stintsByDriver: stints }));
  expect(headline?.title).toBe('Ο Russell σταμάτησε 1 φορά, ο Verstappen 2');
  expect(headline?.lede).toBe('Russell: MEDIUM → HARD · Verstappen: MEDIUM → HARD → SOFT');
  expect(buildHeadline('tires', ctx({ driverNums: [63], stintsByDriver: { 63: [stint(63, 1, 'HARD')] } }))?.title).toBe('Ο Russell έτρεξε χωρίς στάση');
});

it('reports the biggest position change of the selected drivers', () => {
  const pos = (driver_number: number, date: string, position: number) => ({ driver_number, date, position }) as OpenF1Position;
  const positions = [pos(63, '2026-01-01T10:00', 8), pos(63, '2026-01-01T11:30', 3), pos(1, '2026-01-01T10:00', 2), pos(1, '2026-01-01T11:30', 3), pos(4, '2026-01-01T10:00', 1), pos(4, '2026-01-01T11:30', 20)];
  const headline = buildHeadline('positions', ctx({ positions }));
  expect(headline?.title).toBe('Ο Russell κέρδισε 5 θέσεις από την εκκίνηση');
  expect(headline?.lede).toBe('Από τη θέση 8 στη θέση 3.');
});
