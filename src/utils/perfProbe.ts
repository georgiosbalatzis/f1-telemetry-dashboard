// PERF-PROBE (PERFREDO P0-04): dev-only render counter. Remove in P7-01 (this file and its use in TelemetryTab).
import { useEffect } from 'react';

const enabled = import.meta.env.DEV && typeof window !== 'undefined' && window.localStorage?.getItem('perfProbe') === '1';

/** Counts how often the calling component actually re-rendered and committed (memo bail-outs do not count). */
export function usePerfCommit(id: string) {
  useEffect(() => {
    if (!enabled) return;
    const w = window as unknown as { __perfCommits?: Record<string, number> };
    const commits = (w.__perfCommits ||= {});
    commits[id] = (commits[id] ?? 0) + 1;
  });
}
