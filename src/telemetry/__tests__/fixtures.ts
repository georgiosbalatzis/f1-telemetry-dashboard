import type { OpenF1CarData, OpenF1Lap, OpenF1Location } from '../../api/openf1';
import { alignLap, buildTrackReference, lapIdentity, resampleLaps } from '../lapComparison';

export const testLap: OpenF1Lap = { date_start: '2026-10-10T14:20:00.000Z', session_key: 99113, driver_number: 44, lap_number: 21, lap_duration: 100, is_pit_out_lap: false, meeting_key: 1,
  duration_sector_1: 30, duration_sector_2: 40, duration_sector_3: 30, i1_speed: null, i2_speed: null, st_speed: null, segments_sector_1: [], segments_sector_2: [], segments_sector_3: [] };
/** Synthetic geometry only; these fixtures make no claims about Singapore. */
export function circle(lap: OpenF1Lap, step = .5) {
  const locations: OpenF1Location[] = [], car: OpenF1CarData[] = [];
  for (let elapsed = 0; elapsed < lap.lap_duration!; elapsed += step) {
    const angle = elapsed / lap.lap_duration! * Math.PI * 2;
    const date = new Date(Date.parse(lap.date_start) + elapsed * 1000).toISOString();
    locations.push({ date, session_key: lap.session_key, driver_number: 44, meeting_key: 1, x: 2000 + 1000 * Math.cos(angle), y: 2000 + 1000 * Math.sin(angle), z: 0 });
    car.push({ date, session_key: lap.session_key, driver_number: 44, meeting_key: 1, speed: 150 + 30 * Math.sin(angle), throttle: 100, brake: elapsed < 10 ? 100 : 0, n_gear: 6, rpm: 11000, drs: 0 });
  }
  return { locations, car };
}
export function comparisonFixture() {
  const a = lapIdentity(testLap), b = lapIdentity({ ...testLap, lap_number: 24, date_start: '2026-10-10T14:28:00.000Z' });
  const raw = circle(testLap), rawB = circle({ ...testLap, lap_number: 24, date_start: b.start }, .4);
  const ref = buildTrackReference(raw.locations, a, 1000, 'Synthetic closed circle');
  const laps = [alignLap(raw.car, raw.locations, a, ref), alignLap(rawB.car, rawB.locations, b, ref)];
  return { a, b, ref, laps, points: resampleLaps(laps, ref.length) };
}

