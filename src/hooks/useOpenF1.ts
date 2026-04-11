import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  OpenF1Meeting, OpenF1Session, OpenF1Driver, OpenF1Lap,
  OpenF1CarData, OpenF1Stint, OpenF1Pit, OpenF1Weather,
  OpenF1RaceControl, OpenF1TeamRadio, OpenF1SessionResult,
  OpenF1Location, OpenF1Position, OpenF1Interval,
} from '../api/openf1';
import {
  getMeetings, getSessionsByCircuit, getDrivers, getLaps, getCarDataForLap,
  getStints, getPits, getWeather, getRaceControl, getTeamRadio, getSessionResult,
  getPositions, getIntervals, getLocationForLap,
} from '../api/openf1';

// ─── Cache ───────────────────────────────────────────────────────────────────

type CacheEntry = {
  data: unknown;
  ts: number;
  lastAccessed: number;
};

type InflightEntry<T> = {
  controller: AbortController;
  promise: Promise<T>;
  consumers: number;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, InflightEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_STALE_TTL = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function getCacheEntry<T>(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  entry.lastAccessed = Date.now();
  return entry as CacheEntry & { data: T };
}

function setCacheEntry<T>(key: string, data: T) {
  cache.set(key, { data, ts: Date.now(), lastAccessed: Date.now() });
  if (cache.size <= MAX_CACHE_ENTRIES) return;

  const oldest = [...cache.entries()].sort((left, right) => left[1].lastAccessed - right[1].lastAccessed);
  while (cache.size > MAX_CACHE_ENTRIES && oldest.length > 0) {
    const [staleKey] = oldest.shift()!;
    cache.delete(staleKey);
  }
}

function createInflightEntry<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
): InflightEntry<T> {
  const controller = new AbortController();
  return {
    controller,
    consumers: 0,
    promise: (async () => {
      try {
        const data = await fetcher(controller.signal);
        setCacheEntry(key, data);
        return data;
      } finally {
        inflight.delete(key);
      }
    })(),
  };
}

function clearExpiredCacheEntries() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.ts > CACHE_STALE_TTL) {
      cache.delete(key);
    }
  }
}

function isSessionScopedCacheKey(key: string, sessionKey: number) {
  return (
    key === `drivers:${sessionKey}`
    || key === `stints:${sessionKey}`
    || key === `pits:${sessionKey}`
    || key === `weather:${sessionKey}`
    || key === `rc:${sessionKey}`
    || key === `radio:${sessionKey}`
    || key === `result:${sessionKey}`
    || key === `positions:${sessionKey}`
    || key === `intervals:${sessionKey}`
    || key.startsWith(`laps:${sessionKey}:`)
    || key.startsWith(`telem:${sessionKey}:`)
    || key.startsWith(`location:${sessionKey}:`)
  );
}

export function invalidateOpenF1SessionCache(sessionKey: number | null | undefined) {
  if (sessionKey == null) return;

  for (const key of cache.keys()) {
    if (isSessionScopedCacheKey(key, sessionKey)) {
      cache.delete(key);
    }
  }

  for (const [key, entry] of inflight.entries()) {
    if (isSessionScopedCacheKey(key, sessionKey)) {
      entry.controller.abort();
      inflight.delete(key);
    }
  }
}

// ─── Generic hook ────────────────────────────────────────────────────────────

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

type FetchDataState<T> = Omit<FetchState<T>, 'refetch'>;

/**
 * Core data-fetching hook.
 * - `key`: null = disabled (no fetch). A unique string that encodes all params.
 * - `fetcher`: the async function to call. Stored in a ref so it's always fresh.
 *
 * The effect runs whenever `key` changes. The fetcher ref is updated every render
 * so the closure always captures the latest params.
 */
function useFetch<T>(key: string | null, fetcher: (signal: AbortSignal) => Promise<T>): FetchState<T> {
  const [state, setState] = useState<FetchDataState<T>>({ data: null, loading: false, error: null });
  const [refetchToken, setRefetchToken] = useState(0);
  const fetcherRef = useRef(fetcher);
  const seqRef = useRef(0);

  // Always keep fetcherRef current
  fetcherRef.current = fetcher;

  const refetch = useCallback(() => {
    if (!key) return;

    cache.delete(key);
    const active = inflight.get(key);
    if (active) {
      active.controller.abort();
      inflight.delete(key);
    }
    setRefetchToken((token) => token + 1);
  }, [key]);

  useEffect(() => {
    if (!key) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    clearExpiredCacheEntries();
    const seq = ++seqRef.current;
    const cached = getCacheEntry<T>(key);
    const hasFreshCache = cached && Date.now() - cached.ts < CACHE_TTL;

    if (hasFreshCache) {
      setState({ data: cached.data, loading: false, error: null });
      return;
    }

    setState({
      data: cached?.data ?? null,
      loading: true,
      error: null,
    });

    let entry = inflight.get(key) as InflightEntry<T> | undefined;
    if (!entry) {
      entry = createInflightEntry(key, fetcherRef.current);
      inflight.set(key, entry as InflightEntry<unknown>);
    }
    // Capture the entry reference now so the cleanup operates on the exact
    // same entry this effect subscribed to — not a newer one that may have
    // replaced it in the map after the fetch resolved or was retried.
    const capturedEntry = entry;
    capturedEntry.consumers += 1;

    void (async () => {
      try {
        const data = await capturedEntry.promise;
        if (seqRef.current !== seq) return; // stale
        setState({ data, loading: false, error: null });
      } catch (err: unknown) {
        if (seqRef.current !== seq) return;
        if (isAbortError(err)) return;
        console.warn(`[OpenF1] ${key}:`, err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        setState({ data: cached?.data ?? null, loading: false, error: message });
      }
    })();

    return () => {
      capturedEntry.consumers -= 1;
      if (capturedEntry.consumers <= 0) {
        capturedEntry.controller.abort();
        // Only remove from the map when it is still the same entry — a
        // newer fetch may have already replaced it while we were mounted.
        if (inflight.get(key) === (capturedEntry as InflightEntry<unknown>)) {
          inflight.delete(key);
        }
      }
    };
  }, [key, refetchToken]); // key/refetchToken drive fetches — fetcher is accessed via ref

  return { ...state, refetch };
}

// ─── Typed hooks ─────────────────────────────────────────────────────────────

export function useMeetings(year: number) {
  return useFetch<OpenF1Meeting[]>(
    `meetings:${year}`,
    (signal) => getMeetings(year, { signal }),
  );
}

export function useSessions(year: number, circuit: string | null) {
  return useFetch<OpenF1Session[]>(
    circuit ? `sessions:${year}:${circuit}` : null,
    (signal) => getSessionsByCircuit(year, circuit!, { signal }),
  );
}

export function useDrivers(sessionKey: number | null) {
  return useFetch<OpenF1Driver[]>(
    sessionKey ? `drivers:${sessionKey}` : null,
    (signal) => getDrivers(sessionKey!, { signal }),
  );
}

/** Only fetches if both sessionKey and driverNumber are valid positive numbers */
export function useLaps(sessionKey: number | null, driverNumber: number | null | undefined) {
  const ok = sessionKey != null && driverNumber != null && driverNumber > 0;
  return useFetch<OpenF1Lap[]>(
    ok ? `laps:${sessionKey}:${driverNumber}` : null,
    (signal) => getLaps(sessionKey!, driverNumber!, { signal }),
  );
}

/** Telemetry for a specific lap, scoped by date window */
export function useLapTelemetry(
  sessionKey: number | null,
  driverNumber: number | null | undefined,
  lapDateStart: string | null,
  nextLapDateStart: string | null | undefined,
) {
  const ok = sessionKey != null && driverNumber != null && driverNumber > 0 && !!lapDateStart;
  return useFetch<OpenF1CarData[]>(
    ok ? `telem:${sessionKey}:${driverNumber}:${lapDateStart}` : null,
    (signal) => getCarDataForLap(sessionKey!, driverNumber!, lapDateStart!, nextLapDateStart || undefined, { signal, timeoutMs: 20_000 }),
  );
}

export function useStints(sessionKey: number | null) {
  return useFetch<OpenF1Stint[]>(
    sessionKey ? `stints:${sessionKey}` : null,
    (signal) => getStints(sessionKey!, { signal }),
  );
}

export function usePits(sessionKey: number | null) {
  return useFetch<OpenF1Pit[]>(
    sessionKey ? `pits:${sessionKey}` : null,
    (signal) => getPits(sessionKey!, { signal }),
  );
}

export function useWeather(sessionKey: number | null) {
  return useFetch<OpenF1Weather[]>(
    sessionKey ? `weather:${sessionKey}` : null,
    (signal) => getWeather(sessionKey!, { signal }),
  );
}

export function useRaceControl(sessionKey: number | null) {
  return useFetch<OpenF1RaceControl[]>(
    sessionKey ? `rc:${sessionKey}` : null,
    (signal) => getRaceControl(sessionKey!, { signal }),
  );
}

export function useTeamRadio(sessionKey: number | null) {
  return useFetch<OpenF1TeamRadio[]>(
    sessionKey ? `radio:${sessionKey}` : null,
    (signal) => getTeamRadio(sessionKey!, { signal }),
  );
}

export function useSessionResult(sessionKey: number | null) {
  return useFetch<OpenF1SessionResult[]>(
    sessionKey ? `result:${sessionKey}` : null,
    (signal) => getSessionResult(sessionKey!, { signal }),
  );
}

export function usePositions(sessionKey: number | null) {
  return useFetch<OpenF1Position[]>(
    sessionKey ? `positions:${sessionKey}` : null,
    (signal) => getPositions(sessionKey!, { signal, timeoutMs: 30_000 }),
  );
}

export function useIntervals(sessionKey: number | null) {
  return useFetch<OpenF1Interval[]>(
    sessionKey ? `intervals:${sessionKey}` : null,
    (signal) => getIntervals(sessionKey!, { signal, timeoutMs: 30_000 }),
  );
}

export function useLapLocation(
  sessionKey: number | null,
  driverNumber: number | null | undefined,
  lapDateStart: string | null,
  nextLapDateStart: string | null | undefined,
) {
  const ok = sessionKey != null && driverNumber != null && driverNumber > 0 && !!lapDateStart;
  return useFetch<OpenF1Location[]>(
    ok ? `location:${sessionKey}:${driverNumber}:${lapDateStart}` : null,
    (signal) => getLocationForLap(sessionKey!, driverNumber!, lapDateStart!, nextLapDateStart || undefined, { signal, timeoutMs: 20_000 }),
  );
}
