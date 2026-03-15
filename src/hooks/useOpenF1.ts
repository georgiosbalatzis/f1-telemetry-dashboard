import { useState, useEffect, useRef, useMemo } from 'react';
import type {
  OpenF1Meeting, OpenF1Session, OpenF1Driver, OpenF1Lap,
  OpenF1CarData, OpenF1Stint, OpenF1Pit, OpenF1Weather,
  OpenF1RaceControl, OpenF1TeamRadio
} from '../api/openf1';
import {
  getMeetings, getSessionsByCircuit, getDrivers, getLaps, getCarDataForLap,
  getStints, getPits, getWeather, getRaceControl, getTeamRadio
} from '../api/openf1';

// ─── Generic fetch hook ──────────────────────────────────────────────────────

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 min for historical data

function useApi<T>(
  cacheKey: string | null,
  fetcher: (() => Promise<T>) | null,
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: false, error: null });
  const seqRef = useRef(0);

  useEffect(() => {
    // No key or no fetcher → reset
    if (!cacheKey || !fetcher) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    // Check cache
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      setState({ data: hit.data as T, loading: false, error: null });
      return;
    }

    const seq = ++seqRef.current;
    setState(prev => ({ ...prev, loading: true, error: null }));

    fetcher()
      .then(data => {
        if (seqRef.current !== seq) return;
        cache.set(cacheKey, { data, ts: Date.now() });
        setState({ data, loading: false, error: null });
      })
      .catch(err => {
        if (seqRef.current !== seq) return;
        console.warn(`[OpenF1] ${cacheKey}:`, err);
        setState(prev => ({ ...prev, loading: false, error: String(err?.message || err) }));
      });
  // We use cacheKey as the single dependency — it encodes all params
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return state;
}

// ─── Meetings ────────────────────────────────────────────────────────────────

export function useMeetings(year: number) {
  const key = `meetings:${year}`;
  return useApi<OpenF1Meeting[]>(key, () => getMeetings(year));
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export function useSessions(year: number, circuit: string | null) {
  const key = circuit ? `sessions:${year}:${circuit}` : null;
  const fetcher = circuit ? () => getSessionsByCircuit(year, circuit) : null;
  return useApi<OpenF1Session[]>(key, fetcher);
}

// ─── Drivers ─────────────────────────────────────────────────────────────────

export function useDrivers(sessionKey: number | null) {
  const key = sessionKey ? `drivers:${sessionKey}` : null;
  const fetcher = sessionKey ? () => getDrivers(sessionKey) : null;
  return useApi<OpenF1Driver[]>(key, fetcher);
}

// ─── Laps (per driver — ONLY fires if driverNumber is a real number) ─────────

export function useLaps(sessionKey: number | null, driverNumber: number | undefined) {
  const valid = sessionKey != null && driverNumber != null && driverNumber > 0;
  const key = valid ? `laps:${sessionKey}:${driverNumber}` : null;
  const fetcher = valid ? () => getLaps(sessionKey!, driverNumber!) : null;
  return useApi<OpenF1Lap[]>(key, fetcher);
}

// ─── Telemetry for a lap ─────────────────────────────────────────────────────

export function useLapTelemetry(
  sessionKey: number | null,
  driverNumber: number | undefined,
  lapDateStart: string | null,
  nextLapDateStart: string | null | undefined,
) {
  const valid = sessionKey != null && driverNumber != null && driverNumber > 0 && lapDateStart != null;
  const key = valid ? `telem:${sessionKey}:${driverNumber}:${lapDateStart}` : null;
  const fetcher = valid
    ? () => getCarDataForLap(sessionKey!, driverNumber!, lapDateStart!, nextLapDateStart || undefined)
    : null;
  return useApi<OpenF1CarData[]>(key, fetcher);
}

// ─── Stints ──────────────────────────────────────────────────────────────────

export function useStints(sessionKey: number | null) {
  const key = sessionKey ? `stints:${sessionKey}` : null;
  const fetcher = sessionKey ? () => getStints(sessionKey) : null;
  return useApi<OpenF1Stint[]>(key, fetcher);
}

// ─── Pits ────────────────────────────────────────────────────────────────────

export function usePits(sessionKey: number | null) {
  const key = sessionKey ? `pits:${sessionKey}` : null;
  const fetcher = sessionKey ? () => getPits(sessionKey) : null;
  return useApi<OpenF1Pit[]>(key, fetcher);
}

// ─── Weather ─────────────────────────────────────────────────────────────────

export function useWeather(sessionKey: number | null) {
  const key = sessionKey ? `weather:${sessionKey}` : null;
  const fetcher = sessionKey ? () => getWeather(sessionKey) : null;
  return useApi<OpenF1Weather[]>(key, fetcher);
}

// ─── Race Control ────────────────────────────────────────────────────────────

export function useRaceControl(sessionKey: number | null) {
  const key = sessionKey ? `rc:${sessionKey}` : null;
  const fetcher = sessionKey ? () => getRaceControl(sessionKey) : null;
  return useApi<OpenF1RaceControl[]>(key, fetcher);
}

// ─── Team Radio ──────────────────────────────────────────────────────────────

export function useTeamRadio(sessionKey: number | null) {
  const key = sessionKey ? `radio:${sessionKey}` : null;
  const fetcher = sessionKey ? () => getTeamRadio(sessionKey) : null;
  return useApi<OpenF1TeamRadio[]>(key, fetcher);
}
