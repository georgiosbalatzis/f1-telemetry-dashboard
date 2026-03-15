// ─── OpenF1 API Client ───────────────────────────────────────────────────────
// Docs: https://openf1.org/docs
// Free historical data (2023+), no auth needed.

const BASE = 'https://api.openf1.org/v1';

// ─── Response Types ──────────────────────────────────────────────────────────

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
  session_name: string;  // "Practice 1", "Qualifying", "Race", etc.
  session_type: string;  // "Practice", "Qualifying", "Race", etc.
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
  brake: number;       // 0 or 100 (binary in API)
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
  compound: string;        // "SOFT", "MEDIUM", "HARD", etc.
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

export interface OpenF1Position {
  date: string;
  driver_number: number;
  position: number;
  session_key: number;
  meeting_key: number;
}

// ─── Fetcher with retry ──────────────────────────────────────────────────────

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      // 429 rate limit — wait and retry
      if (res.status === 429 && i < retries) {
        await new Promise(r => setTimeout(r, 1500 * (i + 1)));
        continue;
      }
      // 5xx — retry
      if (res.status >= 500 && i < retries) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      throw new Error(`API ${res.status}: ${res.statusText}`);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

async function fetchApi<T>(endpoint: string, params: Record<string, string | number>): Promise<T[]> {
  const url = new URL(`${BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetchWithRetry(url.toString());
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// OpenF1 uses special query params like date>= which need manual URL building
function buildFilterUrl(endpoint: string, params: Record<string, string | number>, filters?: Record<string, string>): string {
  let url = `${BASE}/${endpoint}?`;
  const parts: string[] = [];
  Object.entries(params).forEach(([k, v]) => parts.push(`${k}=${encodeURIComponent(v)}`));
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => parts.push(`${k}=${encodeURIComponent(v)}`));
  }
  return url + parts.join('&');
}

// ─── Public API Functions ────────────────────────────────────────────────────

export async function getMeetings(year: number): Promise<OpenF1Meeting[]> {
  return fetchApi<OpenF1Meeting>('meetings', { year });
}

export async function getSessions(meetingKey: number): Promise<OpenF1Session[]> {
  return fetchApi<OpenF1Session>('sessions', { meeting_key: meetingKey });
}

export async function getSessionsByCircuit(year: number, circuitShortName: string): Promise<OpenF1Session[]> {
  return fetchApi<OpenF1Session>('sessions', { year, circuit_short_name: circuitShortName });
}

export async function getDrivers(sessionKey: number): Promise<OpenF1Driver[]> {
  return fetchApi<OpenF1Driver>('drivers', { session_key: sessionKey });
}

export async function getLaps(sessionKey: number, driverNumber: number): Promise<OpenF1Lap[]> {
  return fetchApi<OpenF1Lap>('laps', { session_key: sessionKey, driver_number: driverNumber });
}

export async function getStints(sessionKey: number): Promise<OpenF1Stint[]> {
  return fetchApi<OpenF1Stint>('stints', { session_key: sessionKey });
}

export async function getPits(sessionKey: number): Promise<OpenF1Pit[]> {
  return fetchApi<OpenF1Pit>('pit', { session_key: sessionKey });
}

export async function getWeather(sessionKey: number): Promise<OpenF1Weather[]> {
  return fetchApi<OpenF1Weather>('weather', { session_key: sessionKey });
}

export async function getIntervals(sessionKey: number): Promise<OpenF1RaceControl[]> {
  return fetchApi<OpenF1RaceControl>('intervals', { session_key: sessionKey });
}

export async function getRaceControl(sessionKey: number): Promise<OpenF1RaceControl[]> {
  return fetchApi<OpenF1RaceControl>('race_control', { session_key: sessionKey });
}

export async function getTeamRadio(sessionKey: number): Promise<OpenF1TeamRadio[]> {
  return fetchApi<OpenF1TeamRadio>('team_radio', { session_key: sessionKey });
}

export async function getPositions(sessionKey: number): Promise<OpenF1Position[]> {
  return fetchApi<OpenF1Position>('position', { session_key: sessionKey });
}

/** Fetch car telemetry scoped to a single lap using date_start windowing.
 *  Falls back to a 2-minute window if nextLap is unavailable (last lap). */
export async function getCarDataForLap(
  sessionKey: number,
  driverNumber: number,
  lapDateStart: string,
  nextLapDateStart?: string,
): Promise<OpenF1CarData[]> {
  // If we don't have the next lap's start time, use a 2-min window
  const dateEnd = nextLapDateStart
    || new Date(new Date(lapDateStart).getTime() + 120_000).toISOString();

  const url = buildFilterUrl('car_data',
    { session_key: sessionKey, driver_number: driverNumber },
    { 'date>=': lapDateStart, 'date<=': dateEnd }
  );

  const res = await fetchWithRetry(url);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
