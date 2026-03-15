const BASE = 'https://api.openf1.org/v1';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OpenF1Meeting {
  meeting_key: number; meeting_name: string; meeting_official_name: string;
  circuit_key: number; circuit_short_name: string; country_name: string;
  date_start: string; date_end: string; year: number; location: string;
}
export interface OpenF1Session {
  session_key: number; session_name: string; session_type: string;
  meeting_key: number; date_start: string; date_end: string; year: number;
  circuit_short_name: string; circuit_key: number; country_name: string;
}
export interface OpenF1Driver {
  driver_number: number; broadcast_name: string; first_name: string;
  last_name: string; full_name: string; name_acronym: string;
  team_name: string; team_colour: string; headshot_url: string | null;
  session_key: number; meeting_key: number;
}
export interface OpenF1CarData {
  date: string; driver_number: number; speed: number; throttle: number;
  brake: number; n_gear: number; rpm: number; drs: number;
  session_key: number; meeting_key: number;
}
export interface OpenF1Location {
  date: string; driver_number: number; x: number; y: number; z: number;
  session_key: number; meeting_key: number;
}
export interface OpenF1Lap {
  date_start: string; driver_number: number; lap_number: number;
  lap_duration: number | null; duration_sector_1: number | null;
  duration_sector_2: number | null; duration_sector_3: number | null;
  i1_speed: number | null; i2_speed: number | null; st_speed: number | null;
  is_pit_out_lap: boolean;
  segments_sector_1: number[]; segments_sector_2: number[]; segments_sector_3: number[];
  session_key: number; meeting_key: number;
}
export interface OpenF1Stint {
  driver_number: number; stint_number: number; lap_start: number;
  lap_end: number; compound: string; tyre_age_at_start: number;
  session_key: number; meeting_key: number;
}
export interface OpenF1Pit {
  date: string; driver_number: number; lap_number: number;
  pit_duration: number; stop_duration: number;
  session_key: number; meeting_key: number;
}
export interface OpenF1Weather {
  date: string; air_temperature: number; track_temperature: number;
  humidity: number; wind_speed: number; wind_direction: number;
  rainfall: boolean; pressure: number; session_key: number; meeting_key: number;
}
export interface OpenF1RaceControl {
  date: string; category: string; flag: string | null; message: string;
  scope: string | null; driver_number: number | null;
  lap_number: number | null; session_key: number; meeting_key: number;
}
export interface OpenF1TeamRadio {
  date: string; driver_number: number; recording_url: string;
  session_key: number; meeting_key: number;
}
export interface OpenF1Position {
  date: string; driver_number: number; position: number;
  session_key: number; meeting_key: number;
}

// ─── URL builder ─────────────────────────────────────────────────────────────

function buildUrl(endpoint: string, params: Record<string, string | number | boolean>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return `${BASE}/${endpoint}${parts.length ? '?' + parts.join('&') : ''}`;
}

function buildUrlWithDateFilters(
  endpoint: string, params: Record<string, string | number>,
  dateFilters: Record<string, string>,
): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) parts.push(`${k}=${encodeURIComponent(String(v))}`);
  for (const [k, v] of Object.entries(dateFilters)) parts.push(`${k}${v}`);
  return `${BASE}/${endpoint}?${parts.join('&')}`;
}

// ─── Fetch with retry ────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, retries = 2): Promise<T[]> {
  let lastErr: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) { const data = await res.json(); return Array.isArray(data) ? data : []; }
      if ((res.status === 429 || res.status >= 500) && i < retries) { await new Promise(r => setTimeout(r, 1500 * (i + 1))); continue; }
      throw new Error(`OpenF1 API ${res.status} ${res.statusText}`);
    } catch (err: unknown) { lastErr = err instanceof Error ? err : new Error(String(err)); if (i < retries) await new Promise(r => setTimeout(r, 1000 * (i + 1))); }
  }
  throw lastErr || new Error('Fetch failed');
}

// ─── Cache ───────────────────────────────────────────────────────────────────

export const apiCache = new Map<string, { data: unknown; ts: number }>();

export function invalidateCache(prefix: string) {
  for (const key of Array.from(apiCache.keys())) { if (key.startsWith(prefix)) apiCache.delete(key); }
}

// ─── API functions ───────────────────────────────────────────────────────────

export const getMeetings = (year: number) => fetchJson<OpenF1Meeting>(buildUrl('meetings', { year }));
export const getSessionsByCircuit = (year: number, circuit: string) => fetchJson<OpenF1Session>(buildUrl('sessions', { year, circuit_short_name: circuit }));
export const getDrivers = (sessionKey: number) => fetchJson<OpenF1Driver>(buildUrl('drivers', { session_key: sessionKey }));
export const getLaps = (sessionKey: number, driverNumber: number) => fetchJson<OpenF1Lap>(buildUrl('laps', { session_key: sessionKey, driver_number: driverNumber }));
export const getStints = (sessionKey: number) => fetchJson<OpenF1Stint>(buildUrl('stints', { session_key: sessionKey }));
export const getPits = (sessionKey: number) => fetchJson<OpenF1Pit>(buildUrl('pit', { session_key: sessionKey }));
export const getWeather = (sessionKey: number) => fetchJson<OpenF1Weather>(buildUrl('weather', { session_key: sessionKey }));
export const getRaceControl = (sessionKey: number) => fetchJson<OpenF1RaceControl>(buildUrl('race_control', { session_key: sessionKey }));
export const getTeamRadio = (sessionKey: number) => fetchJson<OpenF1TeamRadio>(buildUrl('team_radio', { session_key: sessionKey }));
export const getPositions = (sessionKey: number) => fetchJson<OpenF1Position>(buildUrl('position', { session_key: sessionKey }));

export function getCarDataForLap(sessionKey: number, driverNumber: number, lapDateStart: string, nextLapDateStart?: string): Promise<OpenF1CarData[]> {
  const dateEnd = nextLapDateStart || new Date(new Date(lapDateStart).getTime() + 120_000).toISOString();
  return fetchJson<OpenF1CarData>(buildUrlWithDateFilters('car_data', { session_key: sessionKey, driver_number: driverNumber }, { 'date>=': lapDateStart, 'date<=': dateEnd }));
}

export function getLocationForLap(sessionKey: number, driverNumber: number, lapDateStart: string, nextLapDateStart?: string): Promise<OpenF1Location[]> {
  const dateEnd = nextLapDateStart || new Date(new Date(lapDateStart).getTime() + 120_000).toISOString();
  return fetchJson<OpenF1Location>(buildUrlWithDateFilters('location', { session_key: sessionKey, driver_number: driverNumber }, { 'date>=': lapDateStart, 'date<=': dateEnd }));
}

export function isSessionPotentiallyLive(dateEnd: string | undefined): boolean {
  if (!dateEnd) return false;
  return new Date(dateEnd).getTime() > Date.now() - 30 * 60 * 1000;
}
