// PERF-PROBE (PERFREDO P0-04): dev-only render counter. Remove in P7-01 (this file and its use in DashboardShell).
import { Profiler, type ReactNode } from 'react';

const enabled = import.meta.env.DEV && typeof window !== 'undefined' && window.localStorage?.getItem('perfProbe') === '1';

const count = (id: string) => {
  const w = window as unknown as { __perfCommits?: Record<string, number> };
  const commits = (w.__perfCommits ||= {});
  commits[id] = (commits[id] ?? 0) + 1;
};

export function PerfProbe({ id, children }: { id: string; children: ReactNode }) {
  return enabled ? <Profiler id={id} onRender={() => count(id)}>{children}</Profiler> : children;
}
