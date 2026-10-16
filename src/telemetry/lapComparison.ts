import type { OpenF1CarData, OpenF1Lap, OpenF1Location, OpenF1RaceControl } from '../api/openf1';

export type LapIdentity = { id: string; sessionKey: number; driverNumber: number; lapNumber: number; start: string; end: string; duration: number };
export function lapIdentity(lap: OpenF1Lap): LapIdentity {
  const start = Date.parse(lap.date_start);
  if (!Number.isFinite(start) || !lap.lap_duration || lap.lap_duration <= 0 || lap.is_pit_out_lap) throw new Error('A completed flying lap with timestamps is required.');
  const end = new Date(start + lap.lap_duration * 1000).toISOString();
  const isoStart = new Date(start).toISOString();
  return { id: `${lap.session_key}:${lap.driver_number}:${lap.lap_number}:${isoStart}:${end}`, sessionKey: lap.session_key, driverNumber: lap.driver_number, lapNumber: lap.lap_number, start: isoStart, end, duration: lap.lap_duration };
}

export type LapEvidence = { source: string; phase: 3; start: string; end: string; validLapNumbers: number[]; deletedLapNumbers: number[] };
/** Requires independently verified phase and validity; a fast-looking lap alone is never Q3 evidence. */
export function selectQ3Laps(laps: OpenF1Lap[], evidence: LapEvidence) {
  if (!evidence.source.trim() || evidence.phase !== 3 || !(Date.parse(evidence.start) < Date.parse(evidence.end))) throw new Error('Verified Q3 interval required.');
  const candidates = laps.filter(lap => evidence.validLapNumbers.includes(lap.lap_number) && !evidence.deletedLapNumbers.includes(lap.lap_number)
    && !lap.is_pit_out_lap && (lap.lap_duration ?? 0) > 0 && Date.parse(lap.date_start) >= Date.parse(evidence.start) && Date.parse(lap.date_start) < Date.parse(evidence.end))
    .sort((a, b) => Date.parse(a.date_start) - Date.parse(b.date_start));
  return { candidates, discrepancy: candidates.length === 2 ? null : `Expected two verified Q3 flying laps; found ${candidates.length}.` };
}

/** OpenF1 pit mini-sectors exclude in-laps, but do not establish official lap validity. */
export function isFlyingLap(lap: OpenF1Lap, events: OpenF1RaceControl[] = []) {
  const validity = events.filter(event => {
    const driver = event.driver_number ?? Number(event.message.match(/\bCAR\s+(\d+)\b/)?.[1]);
    const number = event.lap_number ?? Number(event.message.match(/\bLAP\s+(\d+)\b/)?.[1]);
    return driver === lap.driver_number && number === lap.lap_number && /DELETED|REINSTATED/.test(event.message);
  }).sort((a, b) => Date.parse(a.date) - Date.parse(b.date)).slice(-1)[0];
  return !lap.is_pit_out_lap && (lap.lap_duration ?? 0) > 0
    && [lap.segments_sector_1, lap.segments_sector_2, lap.segments_sector_3].every(values => !values.includes(2064))
    && (!validity || /REINSTATED/.test(validity.message));
}

export type StreamQuality = { raw: number; accepted: number; rejected: number; nonMonotonic: number; medianIntervalMs: number | null; maxGapMs: number | null; startOffsetMs: number | null; endOffsetMs: number | null };
function clean<T extends { date: string; session_key: number; driver_number: number }>(raw: T[], lap: LapIdentity, valid: (sample: T) => boolean) {
  let previous = -Infinity;
  let nonMonotonic = 0;
  const accepted: T[] = [];
  for (const sample of raw) {
    const t = Date.parse(sample.date);
    if (t <= previous) nonMonotonic++;
    if (!Number.isFinite(t) || t <= previous || t < Date.parse(lap.start) || t >= Date.parse(lap.end)
      || sample.session_key !== lap.sessionKey || sample.driver_number !== lap.driverNumber || !valid(sample)) continue;
    previous = t;
    accepted.push(sample);
  }
  const intervals = accepted.slice(1).map((sample, i) => Date.parse(sample.date) - Date.parse(accepted[i].date)).sort((a, b) => a - b);
  const quality: StreamQuality = { raw: raw.length, accepted: accepted.length, rejected: raw.length - accepted.length, nonMonotonic,
    medianIntervalMs: intervals.length ? intervals[Math.floor(intervals.length / 2)] : null, maxGapMs: intervals.length ? intervals[intervals.length - 1] : null,
    startOffsetMs: accepted.length ? Date.parse(accepted[0].date) - Date.parse(lap.start) : null,
    endOffsetMs: accepted.length ? Date.parse(lap.end) - Date.parse(accepted[accepted.length - 1].date) : null };
  return { samples: accepted, quality };
}
export const cleanCar = (raw: OpenF1CarData[], lap: LapIdentity) => clean(raw, lap, sample => Number.isFinite(sample.speed) && sample.speed >= 0 && sample.speed <= 400);
export const cleanLocation = (raw: OpenF1Location[], lap: LapIdentity) => clean(raw, lap, sample => [sample.x, sample.y].every(Number.isFinite) && (sample.x !== 0 || sample.y !== 0));

type Vertex = { x: number; y: number; distance: number };
export type TrackReference = { vertices: Vertex[]; length: number; metresPerUnit: number; source: string; origin: string; maxLocationGapMs: number; rejectedPositions: number };
export type AlignmentOptions = { gridMetres: number; maxLocationGapMs: number; maxTelemetryGapMs: number; maxProjectionErrorMetres: number; maxSpeedMetresPerSecond: number };
export const DEFAULT_ALIGNMENT: AlignmentOptions = { gridMetres: 5, maxLocationGapMs: 1200, maxTelemetryGapMs: 600, maxProjectionErrorMetres: 25, maxSpeedMetresPerSecond: 125 };

/** Calibrate an observed closed trajectory to a sourced centreline length. Coordinates are NOT assumed to be metres. */
export function buildTrackReference(raw: OpenF1Location[], lap: LapIdentity, length: number, source: string, options = DEFAULT_ALIGNMENT): TrackReference {
  if (!(length > 500 && length < 10000) || !source.trim()) throw new Error('A sourced circuit length in metres is required.');
  const cleaned = cleanLocation(raw, lap).samples;
  const rawLength = cleaned.slice(1).reduce((total, point, i) => total + Math.hypot(point.x - cleaned[i].x, point.y - cleaned[i].y), 0);
  const provisionalScale = length / rawLength;
  const samples: OpenF1Location[] = [];
  for (const point of cleaned) {
    const previous = samples[samples.length - 1];
    if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) * provisionalScale / ((Date.parse(point.date) - Date.parse(previous.date)) / 1000) > options.maxSpeedMetresPerSecond) continue;
    samples.push(point);
  }
  if (samples.length < 20) throw new Error('Insufficient position coverage for a closed reference trajectory.');
  const first = samples[0], last = samples[samples.length - 1];
  if (Date.parse(first.date) - Date.parse(lap.start) > options.maxLocationGapMs || Date.parse(lap.end) - Date.parse(last.date) > options.maxLocationGapMs) throw new Error('Position coverage does not reach the lap boundaries.');
  let distance = 0;
  const vertices = samples.map((point, i) => {
    if (i) {
      if (Date.parse(point.date) - Date.parse(samples[i - 1].date) > options.maxLocationGapMs) throw new Error('Reference position gap exceeds the alignment limit.');
      distance += Math.hypot(point.x - samples[i - 1].x, point.y - samples[i - 1].y);
    }
    return { x: point.x, y: point.y, distance };
  });
  const closing = Math.hypot(first.x - last.x, first.y - last.y);
  distance += closing;
  if (!distance || closing / distance > .015) throw new Error('Reference trajectory does not close at the start/finish.');
  const metresPerUnit = length / distance;
  vertices.push({ x: first.x, y: first.y, distance });
  vertices.forEach(vertex => { vertex.distance *= metresPerUnit; });
  for (let i = 1; i < samples.length; i++) {
    const dt = (Date.parse(samples[i].date) - Date.parse(samples[i - 1].date)) / 1000;
    if ((vertices[i].distance - vertices[i - 1].distance) / dt > options.maxSpeedMetresPerSecond) throw new Error('Implausible position jump in the reference trajectory.');
  }
  return { vertices, length, metresPerUnit, source, origin: `First accepted location of ${lap.id} at ${first.date}; approximate timing origin`, maxLocationGapMs: options.maxLocationGapMs, rejectedPositions: raw.length - samples.length };
}

export function projectPosition(x: number, y: number, reference: TrackReference) {
  let error = Infinity, distance = 0;
  for (let i = 1; i < reference.vertices.length; i++) {
    const a = reference.vertices[i - 1], b = reference.vertices[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const fraction = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    const residual = Math.hypot(x - a.x - dx * fraction, y - a.y - dy * fraction) * reference.metresPerUnit;
    if (residual < error) { error = residual; distance = a.distance + (b.distance - a.distance) * fraction; }
  }
  return { distance, error };
}
export type AlignedSample = { distance: number; elapsed: number; speed: number; throttle: number | null; brake: number | null; gear: number | null; rpm: number | null; segment: number };
export type AlignedLap = { lap: LapIdentity; samples: AlignedSample[]; quality: { car: StreamQuality; location: StreamQuality; rejectedProjections: number; unsynchronized: number; rejectedLocationDates: string[]; unsynchronizedCarDates: string[]; brakeValues: number[] } };
const signal = (value: number, max: number) => Number.isFinite(value) && value >= 0 && value <= max ? value : null;
/** Brake encodes application state (0 / 100), never hydraulic pressure. Unknown values remain unavailable. */
export const brakeState = (value: number) => value === 0 ? 0 : value === 100 ? 1 : null;

export function alignLap(rawCar: OpenF1CarData[], rawLocation: OpenF1Location[], lap: LapIdentity, reference: TrackReference, options = DEFAULT_ALIGNMENT): AlignedLap {
  const car = cleanCar(rawCar, lap), location = cleanLocation(rawLocation, lap);
  const positions: { t: number; distance: number; segment: number }[] = [];
  let rejectedProjections = 0, segment = 0;
  const rejectedLocationDates: string[] = [], unsynchronizedCarDates: string[] = [];
  for (const point of location.samples) {
    const projected = projectPosition(point.x, point.y, reference);
    const t = Date.parse(point.date);
    let distance = projected.distance;
    const previous = positions[positions.length - 1];
    if (!previous && distance > reference.length * .9) distance -= reference.length;
    if (previous && distance < reference.length * .1 && previous.distance > reference.length * .9) distance += reference.length;
    const dt = previous ? (t - previous.t) / 1000 : 0;
    if (projected.error > options.maxProjectionErrorMetres || (previous && (distance <= previous.distance || (distance - previous.distance) / dt > options.maxSpeedMetresPerSecond))) {
      rejectedProjections++; rejectedLocationDates.push(point.date); segment++; continue;
    }
    if (previous && t - previous.t > options.maxLocationGapMs) segment++;
    positions.push({ t, distance, segment });
  }
  const samples: AlignedSample[] = [];
  let cursor = 0, unsynchronized = 0;
  for (const point of car.samples) {
    const t = Date.parse(point.date);
    while (cursor + 1 < positions.length && positions[cursor + 1].t < t) cursor++;
    const a = positions[cursor], b = positions[cursor + 1];
    if (!a || !b || t < a.t || t > b.t || a.segment !== b.segment || b.t - a.t > options.maxLocationGapMs) { unsynchronized++; unsynchronizedCarDates.push(point.date); continue; }
    const distance = a.distance + (b.distance - a.distance) * (t - a.t) / (b.t - a.t);
    samples.push({ distance, elapsed: (t - Date.parse(lap.start)) / 1000, speed: point.speed, throttle: signal(point.throttle, 100), brake: brakeState(point.brake), gear: signal(point.n_gear, 8), rpm: signal(point.rpm, 25000), segment: a.segment });
  }
  return { lap, samples, quality: { car: car.quality, location: location.quality, rejectedProjections, unsynchronized, rejectedLocationDates, unsynchronizedCarDates, brakeValues: [...new Set(car.samples.map(point => point.brake).filter(value => Number.isFinite(value) && value >= 0 && value <= 100))].sort((a, b) => a - b) } };
}

export type DistancePoint = { distance: number; [key: string]: number | null };
export const seriesKey = (id: string, channel: string) => `${channel}_${id}`;
/** Linear continuous channels, left-held discrete states, no extrapolation or bridging rejected segments. */
export function resampleLaps(laps: AlignedLap[], length: number, options = DEFAULT_ALIGNMENT): DistancePoint[] {
  if (options.gridMetres <= 0 || length / options.gridMetres > 4094 || !Number.isFinite(length)) throw new Error('Invalid distance grid.');
  if (new Set(laps.map(({ lap }) => `${lap.sessionKey}:${lap.driverNumber}:${lap.lapNumber}`)).size !== laps.length) throw new Error('Select two different laps.');
  const cursors = laps.map(() => 0);
  const grid = Array.from({ length: Math.floor(length / options.gridMetres) + 1 }, (_, i) => i * options.gridMetres);
  if (grid[grid.length - 1] !== length) grid.push(length);
  return grid.map(distance => {
    const point: DistancePoint = { distance };
    laps.forEach(({ lap, samples }, i) => {
      while (cursors[i] + 1 < samples.length && samples[cursors[i] + 1].distance < distance) cursors[i]++;
      const a = samples[cursors[i]], b = samples[cursors[i] + 1];
      const usable = a && b && a.distance <= distance && b.distance >= distance && b.distance > a.distance && a.segment === b.segment
        && (b.elapsed - a.elapsed) * 1000 <= options.maxTelemetryGapMs;
      for (const channel of ['speed', 'throttle', 'brake', 'gear', 'rpm', 'elapsed'] as const) {
        const av = a?.[channel], bv = b?.[channel];
        const exact = a?.distance === distance ? av : b?.distance === distance ? bv : undefined;
        point[seriesKey(lap.id, channel)] = exact != null ? exact : usable && av != null && bv != null
          ? ['brake', 'gear'].includes(channel) ? (distance === b.distance ? bv : av) : av + (bv - av) * (distance - a.distance) / (b.distance - a.distance) : null;
      }
    });
    return point;
  });
}

export type CornerMarker = { label: string; distance: number; start: number; end: number; source: string; uncertaintyMetres: number };
export function validateCorners(corners: CornerMarker[], length: number) {
  for (const corner of corners) if (!corner.source.trim() || !Number.isFinite(corner.uncertaintyMetres) || corner.uncertaintyMetres < 0
    || !(0 <= corner.start && corner.start <= corner.distance && corner.distance <= corner.end && corner.end <= length)) throw new Error('Corner markers require sourced distance boundaries.');
}

export function timingValidation(laps: AlignedLap[], points: DistancePoint[], toleranceSeconds = .1) {
  const officialDelta = laps.length === 2 ? laps[1].lap.duration - laps[0].lap.duration : null;
  const first = points[0], last = points[points.length - 1];
  const endpoints = laps.map(({ lap }) => [first?.[seriesKey(lap.id, 'elapsed')], last?.[seriesKey(lap.id, 'elapsed')]]);
  const reconstructedDelta = endpoints.length === 2 && endpoints.every(pair => pair.every(value => typeof value === 'number'))
    ? (endpoints[1][1]! - endpoints[1][0]!) - (endpoints[0][1]! - endpoints[0][0]!) : null;
  return { officialDelta, reconstructedDelta, toleranceSeconds, agrees: reconstructedDelta != null && officialDelta != null && Math.abs(reconstructedDelta - officialDelta) <= toleranceSeconds,
    reason: reconstructedDelta == null ? 'No extrapolation to unsampled start/finish; corner time losses are not validated.' : 'Finish delta checked against recorded duration.' };
}
