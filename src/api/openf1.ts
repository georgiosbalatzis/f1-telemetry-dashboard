// ─── OpenF1 API Client ───────────────────────────────────────────────────────
// https://openf1.org/docs — Free historical data (2023+), no auth.
//
// IMPORTANT: OpenF1 uses filter operators in query param names like:
//   ?date>=2024-03-01T12:00:00  (NOT date%3E%3D= or date>==)
//   ?speed>=300
// We must build these URLs manually without URLSearchParams encoding.

const BASE = 'https://api.openf1.org/v1';
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRIES = 2;
const FALLBACK_LAP_WINDOW_MS = 120_000;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  circuit_key: number;
  circuit_short_name: string;
  country_name: string;
  date_start: string;
  date_end: string;
  year: number;
  location: string;
}

export interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  meeting_key: number;
  date_start: string;
  date_end: string;
  year: number;
  circuit_short_name: string;
  circuit_key: number;
  country_name: string;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  first_name: string;
  last_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url: string | null;
  session_key: number;
  meeting_key: number;
}

export interface OpenF1CarData {
  date: string;
  driver_number: number;
  speed: number;
  throttle: number;
  brake: number;
  n_gear: number;
  rpm: number;
  drs: number;
  session_key: number;
  meeting_key: number;
}

export interface OpenF1Lap {
  date_start: string;
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  st_speed: number | null;
  is_pit_out_lap: boolean;
  segments_sector_1: number[];
  segments_sector_2: number[];
  segments_sector_3: number[];
  session_key: number;
  meeting_key: number;
}

export interface OpenF1Stint {
  driver_number: number;
  stint_number: number;
  lap_start: number;
  lap_end: number;
  compound: string;
  tyre_age_at_start: number;
  session_key: number;
  meeting_key: number;
}

export interface OpenF1Pit {
  date: string;
  driver_number: number;
  lap_number: number;
  pit_duration: number;
  stop_duration: number;
  session_key: number;
  meeting_key: number;
}

export interface OpenF1Weather {
  date: string;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  rainfall: boolean;
  pressure: number;
  session_key: number;
  meeting_key: number;
}

export interface OpenF1RaceControl {
  date: string;
  category: string;
  flag: string | null;
  message: string;
  scope: string | null;
  driver_number: number | null;
  lap_number: number | null;
  session_key: number;
  meeting_key: number;
}

export interface OpenF1TeamRadio {
  date: string;
  driver_number: number;
  recording_url: string;
  session_key: number;
  meeting_key: number;
}

export interface OpenF1SessionResult {
  driver_number: number;
  position: number;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  number_of_laps: number;
  duration: number | number[] | null;
  gap_to_leader: number | string | Array<number | string> | null;
  session_key: number;
  meeting_key: number;
}

// ─── URL builder ─────────────────────────────────────────────────────────────

type QueryValue = string | number | boolean | null | undefined;
type RequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
};

function sortEntries(params: Record<string, QueryValue>) {
  return Object.entries(params).sort(([left], [right]) => left.localeCompare(right));
}

/**
 * Builds OpenF1 query URLs while preserving operator syntax in parameter names.
 * Supported keys include plain filters (`session_key`) and OpenF1 operator keys
 * such as `date>=`, `date<=`, `speed>=`; keys are not encoded, values are.
 */
function buildUrl(endpoint: string, params: Record<string, QueryValue>): string {
  const parts = sortEntries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return `${BASE}/${endpoint}${parts.length ? '?' + parts.join('&') : ''}`;
}

/**
 * Builds URLs for date-windowed endpoints. `dateFilters` keys must include the
 * OpenF1 operator (`date>=`, `date<=`) and values are appended as ISO strings
 * without escaping colons, matching the API's expected filter format.
 */
function buildUrlWithDateFilters(
  endpoint: string,
  params: Record<string, QueryValue>,
  dateFilters: Record<string, string>,
): string {
  const parts: string[] = [];
  for (const [k, v] of sortEntries(params)) {
    if (v === undefined || v === null || v === '') continue;
    parts.push(`${k}=${encodeURIComponent(String(v))}`);
  }
  for (const [k, v] of sortEntries(dateFilters)) {
    parts.push(`${k}${v}`);
  }
  return `${BASE}/${endpoint}?${parts.join('&')}`;
}

// ─── Fetch with retry ────────────────────────────────────────────────────────

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    function onAbort() {
      signal?.removeEventListener('abort', onAbort);
      window.clearTimeout(timeoutId);
      reject(signal?.reason instanceof Error ? signal.reason : new DOMException('Request aborted', 'AbortError'));
    }

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) {
        onAbort();
      }
    }
  });
}

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort(new Error(`OpenF1 request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => window.clearTimeout(timeoutId),
  };
}

function combineSignals(signal?: AbortSignal, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const timeout = createTimeoutSignal(timeoutMs);
  if (!signal) {
    return { signal: timeout.signal, cleanup: timeout.cleanup };
  }

  const controller = new AbortController();
  const abort = (reason?: unknown) => {
    if (!controller.signal.aborted) {
      controller.abort(reason);
    }
  };

  const onSourceAbort = () => {
    signal.removeEventListener('abort', onSourceAbort);
    abort(signal.reason);
  };
  const onTimeoutAbort = () => {
    timeout.signal.removeEventListener('abort', onTimeoutAbort);
    abort(timeout.signal.reason);
  };

  signal.addEventListener('abort', onSourceAbort, { once: true });
  if (signal.aborted) {
    onSourceAbort();
  }

  timeout.signal.addEventListener('abort', onTimeoutAbort, { once: true });
  if (timeout.signal.aborted) {
    onTimeoutAbort();
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      timeout.cleanup();
      signal.removeEventListener('abort', onSourceAbort);
      timeout.signal.removeEventListener('abort', onTimeoutAbort);
    },
  };
}

async function fetchJson<T>(url: string, options: RequestOptions = {}): Promise<T[]> {
  const retries = options.retries ?? DEFAULT_RETRIES;
  const { signal, cleanup } = combineSignals(options.signal, options.timeoutMs);
  let lastErr: Error | null = null;
  try {
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, { signal });
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        }
        if ((res.status === 429 || res.status >= 500) && i < retries) {
          await sleep(1500 * (i + 1), signal);
          continue;
        }
        throw new Error(`OpenF1 API ${res.status} ${res.statusText}`);
      } catch (err: unknown) {
        if (signal.aborted) {
          throw signal.reason instanceof Error ? signal.reason : new DOMException('Request aborted', 'AbortError');
        }
        lastErr = err instanceof Error ? err : new Error('Fetch failed');
        if (i < retries) await sleep(1000 * (i + 1), signal);
      }
    }
    throw lastErr || new Error('Fetch failed');
  } finally {
    cleanup();
  }
}

export interface OpenF1Location {
  date: string;
  driver_number: number;
  x: number;
  y: number;
  z: number;
  session_key: number;
  meeting_key: number;
}

export interface OpenF1Position {
  date: string;
  driver_number: number;
  position: number;
  session_key: number;
  meeting_key: number;
}

export interface OpenF1Interval {
  date: string;
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  session_key: number;
  meeting_key: number;
}

// ─── API functions ───────────────────────────────────────────────────────────

export const getMeetings = (year: number, options?: RequestOptions) =>
  fetchJson<OpenF1Meeting>(buildUrl('meetings', { year }), options);

export const getSessionsByCircuit = (year: number, circuit: string, options?: RequestOptions) =>
  fetchJson<OpenF1Session>(buildUrl('sessions', { year, circuit_short_name: circuit }), options);

export const getDrivers = (sessionKey: number, options?: RequestOptions) =>
  fetchJson<OpenF1Driver>(buildUrl('drivers', { session_key: sessionKey }), options);

export const getLaps = (sessionKey: number, driverNumber: number, options?: RequestOptions) =>
  fetchJson<OpenF1Lap>(buildUrl('laps', { session_key: sessionKey, driver_number: driverNumber }), options);

export const getStints = (sessionKey: number, options?: RequestOptions) =>
  fetchJson<OpenF1Stint>(buildUrl('stints', { session_key: sessionKey }), options);

export const getPits = (sessionKey: number, options?: RequestOptions) =>
  fetchJson<OpenF1Pit>(buildUrl('pit', { session_key: sessionKey }), options);

export const getWeather = (sessionKey: number, options?: RequestOptions) =>
  fetchJson<OpenF1Weather>(buildUrl('weather', { session_key: sessionKey }), options);

export const getRaceControl = (sessionKey: number, options?: RequestOptions) =>
  fetchJson<OpenF1RaceControl>(buildUrl('race_control', { session_key: sessionKey }), options);

export const getTeamRadio = (sessionKey: number, options?: RequestOptions) =>
  fetchJson<OpenF1TeamRadio>(buildUrl('team_radio', { session_key: sessionKey }), options);

export const getSessionResult = (sessionKey: number, options?: RequestOptions) =>
  fetchJson<OpenF1SessionResult>(buildUrl('session_result', { session_key: sessionKey }), options);

export const getPositions = (sessionKey: number, options?: RequestOptions) =>
  fetchJson<OpenF1Position>(buildUrl('position', { session_key: sessionKey }), options);

export const getIntervals = (sessionKey: number, options?: RequestOptions) =>
  fetchJson<OpenF1Interval>(buildUrl('intervals', { session_key: sessionKey }), options);

export function getLocationForLap(
  sessionKey: number,
  driverNumber: number,
  lapDateStart: string,
  nextLapDateStart?: string,
  options?: RequestOptions,
): Promise<OpenF1Location[]> {
  const dateEnd = nextLapDateStart
    || new Date(new Date(lapDateStart).getTime() + FALLBACK_LAP_WINDOW_MS).toISOString();
  const url = buildUrlWithDateFilters(
    'location',
    { session_key: sessionKey, driver_number: driverNumber },
    { 'date>=': lapDateStart, 'date<=': dateEnd },
  );
  return fetchJson<OpenF1Location>(url, options);
}

/** Car telemetry for a single lap, windowed by date_start of this lap and next lap.
 *  If nextLapDateStart is missing (last lap), uses a 2-min window. */
export function getCarDataForLap(
  sessionKey: number,
  driverNumber: number,
  lapDateStart: string,
  nextLapDateStart?: string,
  options?: RequestOptions,
): Promise<OpenF1CarData[]> {
  const dateEnd = nextLapDateStart
    || new Date(new Date(lapDateStart).getTime() + FALLBACK_LAP_WINDOW_MS).toISOString();

  const url = buildUrlWithDateFilters(
    'car_data',
    { session_key: sessionKey, driver_number: driverNumber },
    { 'date>=': lapDateStart, 'date<=': dateEnd },
  );
  return fetchJson<OpenF1CarData>(url, options);
}
