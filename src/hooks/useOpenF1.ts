import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  OpenF1Meeting, OpenF1Session, OpenF1Driver, OpenF1Lap,
  OpenF1CarData, OpenF1Stint, OpenF1Pit, OpenF1Weather,
  OpenF1RaceControl, OpenF1TeamRadio
} from '../api/openf1';
import {
  getMeetings, getSessionsByCircuit, getDrivers, getLaps, getCarDataForLap,
  getStints, getPits, getWeather, getRaceControl, getTeamRadio
} from '../api/openf1';

// ─── Cache ───────────────────────────────────────────────────────────────────

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

// ─── Generic hook ────────────────────────────────────────────────────────────

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Core data-fetching hook.
 * - `key`: null = disabled (no fetch). A unique string that encodes all params.
 * - `fetcher`: the async function to call. Stored in a ref so it's always fresh.
 *
 * The effect runs whenever `key` changes. The fetcher ref is updated every render
 * so the closure always captures the latest params.
 */
function useFetch<T>(key: string | null, fetcher: () => Promise<T>): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: false, error: null });
  const fetcherRef = useRef(fetcher);
  const seqRef = useRef(0);

  // Always keep fetcherRef current
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!key) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    // Cache hit?
    const hit = cache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      setState({ data: hit.data as T, loading: false, error: null });
      return;
    }

    const seq = ++seqRef.current;
    setState({ data: null, loading: true, error: null });

    fetcherRef.current()
      .then(data => {
        if (seqRef.current !== seq) return; // stale
        cache.set(key, { data, ts: Date.now() });
        setState({ data, loading: false, error: null });
      })
      .catch((err: any) => {
        if (seqRef.current !== seq) return;
        console.warn(`[OpenF1] ${key}:`, err);
        setState({ data: null, loading: false, error: String(err?.message || 'Unknown error') });
      });
  }, [key]); // ONLY key — fetcher is accessed via ref

  return state;
}

// ─── Typed hooks ─────────────────────────────────────────────────────────────

export function useMeetings(year: number) {
  return useFetch<OpenF1Meeting[]>(
    `meetings:${year}`,
    () => getMeetings(year),
  );
}

export function useSessions(year: number, circuit: string | null) {
  return useFetch<OpenF1Session[]>(
    circuit ? `sessions:${year}:${circuit}` : null,
    () => getSessionsByCircuit(year, circuit!),
  );
}

export function useDrivers(sessionKey: number | null) {
  return useFetch<OpenF1Driver[]>(
    sessionKey ? `drivers:${sessionKey}` : null,
    () => getDrivers(sessionKey!),
  );
}

/** Only fetches if both sessionKey and driverNumber are valid positive numbers */
export function useLaps(sessionKey: number | null, driverNumber: number | undefined) {
  const ok = sessionKey != null && driverNumber != null && driverNumber > 0;
  return useFetch<OpenF1Lap[]>(
    ok ? `laps:${sessionKey}:${driverNumber}` : null,
    () => getLaps(sessionKey!, driverNumber!),
  );
}

/** Telemetry for a specific lap, scoped by date window */
export function useLapTelemetry(
  sessionKey: number | null,
  driverNumber: number | undefined,
  lapDateStart: string | null,
  nextLapDateStart: string | null | undefined,
) {
  const ok = sessionKey != null && driverNumber != null && driverNumber > 0 && !!lapDateStart;
  return useFetch<OpenF1CarData[]>(
    ok ? `telem:${sessionKey}:${driverNumber}:${lapDateStart}` : null,
    () => getCarDataForLap(sessionKey!, driverNumber!, lapDateStart!, nextLapDateStart || undefined),
  );
}

export function useStints(sessionKey: number | null) {
  return useFetch<OpenF1Stint[]>(
    sessionKey ? `stints:${sessionKey}` : null,
    () => getStints(sessionKey!),
  );
}

export function usePits(sessionKey: number | null) {
  return useFetch<OpenF1Pit[]>(
    sessionKey ? `pits:${sessionKey}` : null,
    () => getPits(sessionKey!),
  );
}

export function useWeather(sessionKey: number | null) {
  return useFetch<OpenF1Weather[]>(
    sessionKey ? `weather:${sessionKey}` : null,
    () => getWeather(sessionKey!),
  );
}

export function useRaceControl(sessionKey: number | null) {
  return useFetch<OpenF1RaceControl[]>(
    sessionKey ? `rc:${sessionKey}` : null,
    () => getRaceControl(sessionKey!),
  );
}

export function useTeamRadio(sessionKey: number | null) {
  return useFetch<OpenF1TeamRadio[]>(
    sessionKey ? `radio:${sessionKey}` : null,
    () => getTeamRadio(sessionKey!),
  );
}
