import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  OpenF1Meeting, OpenF1Session, OpenF1Driver, OpenF1Lap,
  OpenF1CarData, OpenF1Location, OpenF1Stint, OpenF1Pit, OpenF1Weather,
  OpenF1RaceControl, OpenF1TeamRadio, OpenF1Position
} from '../api/openf1';
import {
  getMeetings, getSessionsByCircuit, getDrivers, getLaps, getCarDataForLap,
  getLocationForLap, getStints, getPits, getWeather, getRaceControl, getTeamRadio,
  getPositions, apiCache
} from '../api/openf1';

const CACHE_TTL = 10 * 60 * 1000;
const LIVE_CACHE_TTL = 15 * 1000;

export interface FetchState<T> { data: T | null; loading: boolean; error: string | null; }

function useFetch<T>(key: string | null, fetcher: () => Promise<T>, liveTtl?: number): FetchState<T> & { refetch: () => void } {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: false, error: null });
  const fetcherRef = useRef(fetcher);
  const seqRef = useRef(0);
  fetcherRef.current = fetcher;

  const doFetch = useCallback((forceRefresh = false) => {
    if (!key) { setState({ data: null, loading: false, error: null }); return; }
    const ttl = liveTtl ?? CACHE_TTL;
    const hit = apiCache.get(key);
    if (!forceRefresh && hit && Date.now() - hit.ts < ttl) { setState({ data: hit.data as T, loading: false, error: null }); return; }
    const seq = ++seqRef.current;
    setState(prev => ({ ...prev, loading: true, error: null }));
    fetcherRef.current()
      .then(data => { if (seqRef.current !== seq) return; apiCache.set(key, { data, ts: Date.now() }); setState({ data, loading: false, error: null }); })
      .catch((err: unknown) => { if (seqRef.current !== seq) return; setState(prev => ({ ...prev, loading: false, error: err instanceof Error ? err.message : 'Unknown error' })); });
  }, [key, liveTtl]);

  useEffect(() => { doFetch(); }, [doFetch]);
  const refetch = useCallback(() => doFetch(true), [doFetch]);
  return { ...state, refetch };
}

export function useAutoRefresh(isLive: boolean, intervalMs: number, refetchFns: (() => void)[]) {
  const fnsRef = useRef(refetchFns);
  fnsRef.current = refetchFns;
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => { fnsRef.current.forEach(fn => fn()); }, intervalMs);
    return () => clearInterval(id);
  }, [isLive, intervalMs]);
}

export function useMeetings(year: number) { return useFetch<OpenF1Meeting[]>(`meetings:${year}`, () => getMeetings(year)); }
export function useSessions(year: number, circuit: string | null) { return useFetch<OpenF1Session[]>(circuit ? `sessions:${year}:${circuit}` : null, () => getSessionsByCircuit(year, circuit!)); }
export function useDrivers(sk: number | null, live?: boolean) { return useFetch<OpenF1Driver[]>(sk ? `drivers:${sk}` : null, () => getDrivers(sk!), live ? LIVE_CACHE_TTL : undefined); }
export function useLaps(sk: number | null, dn: number | undefined, live?: boolean) { const ok = sk != null && dn != null && dn > 0; return useFetch<OpenF1Lap[]>(ok ? `laps:${sk}:${dn}` : null, () => getLaps(sk!, dn!), live ? LIVE_CACHE_TTL : undefined); }
export function useLapTelemetry(sk: number | null, dn: number | undefined, start: string | null, next: string | null | undefined) { const ok = sk != null && dn != null && dn > 0 && !!start; return useFetch<OpenF1CarData[]>(ok ? `telem:${sk}:${dn}:${start}` : null, () => getCarDataForLap(sk!, dn!, start!, next || undefined)); }
export function useLapLocation(sk: number | null, dn: number | undefined, start: string | null, next: string | null | undefined) { const ok = sk != null && dn != null && dn > 0 && !!start; return useFetch<OpenF1Location[]>(ok ? `loc:${sk}:${dn}:${start}` : null, () => getLocationForLap(sk!, dn!, start!, next || undefined)); }
export function useStints(sk: number | null, live?: boolean) { return useFetch<OpenF1Stint[]>(sk ? `stints:${sk}` : null, () => getStints(sk!), live ? LIVE_CACHE_TTL : undefined); }
export function usePits(sk: number | null, live?: boolean) { return useFetch<OpenF1Pit[]>(sk ? `pits:${sk}` : null, () => getPits(sk!), live ? LIVE_CACHE_TTL : undefined); }
export function useWeather(sk: number | null, live?: boolean) { return useFetch<OpenF1Weather[]>(sk ? `weather:${sk}` : null, () => getWeather(sk!), live ? LIVE_CACHE_TTL : undefined); }
export function useRaceControl(sk: number | null, live?: boolean) { return useFetch<OpenF1RaceControl[]>(sk ? `rc:${sk}` : null, () => getRaceControl(sk!), live ? LIVE_CACHE_TTL : undefined); }
export function useTeamRadio(sk: number | null, live?: boolean) { return useFetch<OpenF1TeamRadio[]>(sk ? `radio:${sk}` : null, () => getTeamRadio(sk!), live ? LIVE_CACHE_TTL : undefined); }
export function usePositions(sk: number | null, live?: boolean) { return useFetch<OpenF1Position[]>(sk ? `pos:${sk}` : null, () => getPositions(sk!), live ? LIVE_CACHE_TTL : undefined); }
