import { describe, expect, it } from 'vitest';
import { alignLap, isFlyingLap, brakeState, buildTrackReference, cleanCar, DEFAULT_ALIGNMENT, lapIdentity, projectPosition, resampleLaps, selectQ3Laps, seriesKey, timingValidation, validateCorners } from '../lapComparison';

import type { OpenF1RaceControl } from '../../api/openf1';
import { circle, comparisonFixture, testLap } from './fixtures';

describe('same-driver physical distance comparison', () => {
  it('distinguishes laps and boundaries, independent of timestamp formatting', () => {
    const { a, b } = comparisonFixture();
    expect(a.driverNumber).toBe(b.driverNumber); expect(a.id).not.toBe(b.id);
    expect(lapIdentity({ ...testLap, date_start: '2026-10-10T14:20:00+00:00' })).toEqual(a);
    expect(lapIdentity({ ...testLap, lap_duration: 101 }).id).not.toBe(a.id);
    expect(() => lapIdentity({ ...testLap, is_pit_out_lap: true })).toThrow();
  });
  it('requires verified Q3 evidence and reports missing or extra candidates', () => {
    const laps = [testLap, { ...testLap, lap_number: 24, date_start: '2026-10-10T14:28:00Z' }, { ...testLap, lap_number: 12, date_start: '2026-10-10T13:57:00Z' }];
    const evidence = { phase: 3 as const, source: 'Verified timing + deletion review', start: '2026-10-10T14:17:00Z', end: '2026-10-10T14:30:00Z', validLapNumbers: [12,21,24], deletedLapNumbers: [] };
    expect(selectQ3Laps(laps.reverse(), evidence).candidates.map(l => l.lap_number)).toEqual([21,24]);
    expect(selectQ3Laps(laps, { ...evidence, deletedLapNumbers: [24] }).discrepancy).toContain('found 1');
    expect(selectQ3Laps([...laps, { ...testLap, lap_number: 22 }], { ...evidence, validLapNumbers: [21,22,24] }).discrepancy).toContain('found 3');
    expect(() => selectQ3Laps(laps, { ...evidence, source: '' })).toThrow();
  });
  it('clips actual lap boundaries and rejects corrupt, duplicate and backwards timestamps without mutating raw data', () => {
    const { car } = circle(testLap); const before = structuredClone(car);
    const input = [car[0], car[0], { ...car[1], speed: NaN }, car[2], car[1], { ...car[0], date: 'invalid' }, { ...car[0], date: lapIdentity(testLap).end }];
    const cleaned = cleanCar(input, lapIdentity(testLap));
    expect(cleaned.samples).toEqual([car[0], car[2]]); expect(cleaned.quality.rejected).toBe(5); expect(car).toEqual(before);
  });
  it('calibrates physical geometry and aligns unequal sample counts at matched positions', () => {
    const { a, b, ref, points } = comparisonFixture();
    expect(ref.vertices.slice(-1)[0]?.distance).toBeCloseTo(1000);
    expect(projectPosition(2000, 3000, ref).distance).toBeCloseTo(250, 0);
    const middle = points.find(p => p.distance === 250)!;
    expect(middle[seriesKey(a.id, 'speed')]).toBeCloseTo(180, 1);
    expect(middle[seriesKey(b.id, 'speed')]).toBeCloseTo(180, 1);
    expect(points.slice(-1)[0]?.[seriesKey(a.id, 'speed')]).toBeNull();
    expect(() => buildTrackReference([], a, 1000, 'source')).toThrow();
    expect(() => buildTrackReference(circle(testLap).locations, a, 1000, '')).toThrow();
  });
  it('preserves missing telemetry and rejected location regions, and never synthesizes brake pressure', () => {
    const raw = circle(testLap), lap = lapIdentity(testLap); const ref = buildTrackReference(raw.locations, lap, 1000, 'test');
    const car = raw.car.filter(p => { const elapsed = (Date.parse(p.date) - Date.parse(lap.start)) / 1000; return elapsed < 20 || elapsed > 30; });
    const aligned = alignLap(car, raw.locations, lap, ref);
    const grid = resampleLaps([aligned], 1000);
    expect(grid.find(p => p.distance === 250)?.[seriesKey(lap.id, 'speed')]).toBeNull();
    expect(grid.find(p => p.distance === 150)?.[seriesKey(lap.id, 'speed')]).not.toBeNull();
    expect([brakeState(0), brakeState(100), brakeState(50), brakeState(NaN)]).toEqual([0,1,null,null]);
    const jumped = raw.locations.map((p,i) => i === 80 ? { ...p, x: p.x + 50000 } : p);
    expect(alignLap(raw.car, jumped, lap, ref).quality.rejectedProjections).toBeGreaterThan(0);
    const missing = raw.locations.filter((_,i) => i < 80 || i > 90);
    const hole = resampleLaps([alignLap(raw.car, missing, lap, ref)], 1000);
    expect(hole.find(p => p.distance === 425)?.[seriesKey(lap.id, 'speed')]).toBeNull();
    expect(() => resampleLaps([aligned, aligned],1000)).toThrow(/different/);
    expect(() => resampleLaps([aligned],1000,{...DEFAULT_ALIGNMENT,gridMetres:0})).toThrow();
  });
  it('requires sourced corner bounds and refuses an unobserved finish delta', () => {
    expect(() => validateCorners([{ label:'T1',distance:250,start:200,end:300,source:'test geometry',uncertaintyMetres:20 }],1000)).not.toThrow();
    expect(() => validateCorners([{ label:'T1',distance:250,start:300,end:400,source:'',uncertaintyMetres:20 }],1000)).toThrow();
    const { laps, points } = comparisonFixture(); expect(timingValidation(laps,points).reconstructedDelta).toBeNull();
  });
});

it('handles a lap beginning just before the common origin without a false wraparound jump', () => {
  const raw = circle(testLap), lap = lapIdentity(testLap);
  const ref = buildTrackReference(raw.locations, lap, 1000, 'Synthetic circle');
  const shifted = raw.locations.map((p, i) => ({ ...p, x: 2000 + 1000 * Math.cos(i * .5 / 100 * Math.PI * 2 - .01 * Math.PI), y: 2000 + 1000 * Math.sin(i * .5 / 100 * Math.PI * 2 - .01 * Math.PI) }));
  const aligned = alignLap(raw.car, shifted, lap, ref);
  expect(aligned.samples[0].distance).toBeLessThan(0);
  expect(aligned.samples[2].distance).toBeGreaterThan(0);
  expect(aligned.quality.rejectedProjections).toBe(0);
});
it('excludes deleted laps even when OpenF1 stores identity only in the message, and accepts a later reinstatement', () => {
  const event: OpenF1RaceControl = { date: '2026-10-10T14:23:00Z', session_key: testLap.session_key, meeting_key:1, driver_number:null, lap_number:null, category:'Other',flag:null,scope:null,message:'CAR 44 (HAM) LAP DELETED - TRACK LIMITS LAP 21' };
  expect(isFlyingLap(testLap,[event])).toBe(false);
  expect(isFlyingLap(testLap,[{...event,date:'2026-10-10T14:24:00Z',message:'CAR 44 (HAM) LAP 21 REINSTATED'},event])).toBe(true);
});
