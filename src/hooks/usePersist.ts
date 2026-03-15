import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'f1-telemetry-selections';
const BOOKMARKS_KEY = 'f1-telemetry-bookmarks';

export interface PersistedSelections {
  year?: number; circuit?: string | null; sessionKey?: number | null;
  driverNums?: number[]; lapNum?: number; tab?: string;
}

function load(): PersistedSelections {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function save(s: PersistedSelections) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

export function usePersistedSelections() {
  const [initial] = useState<PersistedSelections>(() => {
    // Check URL params first (shared links take priority)
    const params = new URLSearchParams(window.location.search);
    const fromUrl: PersistedSelections = {};
    if (params.get('y')) fromUrl.year = +params.get('y')!;
    if (params.get('c')) fromUrl.circuit = params.get('c');
    if (params.get('sk')) fromUrl.sessionKey = +params.get('sk')!;
    if (params.get('d')) fromUrl.driverNums = params.get('d')!.split(',').map(Number).filter(n => n > 0);
    if (params.get('l')) fromUrl.lapNum = +params.get('l')!;
    if (params.get('t')) fromUrl.tab = params.get('t')!;
    // If URL had params, use those; otherwise use localStorage
    if (Object.keys(fromUrl).length > 0) return fromUrl;
    return load();
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((s: PersistedSelections) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(s), 400);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { initial, persist };
}

/** Build a shareable URL encoding current view state */
export function buildShareUrl(s: PersistedSelections): string {
  const params = new URLSearchParams();
  if (s.year) params.set('y', String(s.year));
  if (s.circuit) params.set('c', s.circuit);
  if (s.sessionKey) params.set('sk', String(s.sessionKey));
  if (s.driverNums?.length) params.set('d', s.driverNums.join(','));
  if (s.lapNum) params.set('l', String(s.lapNum));
  if (s.tab) params.set('t', s.tab);
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

/** Bookmarked laps */
export interface LapBookmark {
  lapNum: number; label?: string; ts: number;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<LapBookmark[]>(() => {
    try { const raw = localStorage.getItem(BOOKMARKS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  const save = useCallback((bm: LapBookmark[]) => {
    setBookmarks(bm);
    try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bm)); } catch { /* noop */ }
  }, []);

  const toggle = useCallback((lapNum: number) => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.lapNum === lapNum);
      const next = exists ? prev.filter(b => b.lapNum !== lapNum) : [...prev, { lapNum, ts: Date.now() }];
      try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const isBookmarked = useCallback((lapNum: number) => bookmarks.some(b => b.lapNum === lapNum), [bookmarks]);

  return { bookmarks, toggle, isBookmarked, clear: () => save([]) };
}
