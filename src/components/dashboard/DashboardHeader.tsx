import { Loader2 } from 'lucide-react';

export function DashboardHeader({ loading }: { loading: boolean }) {
  return (
    <header className="flex items-end justify-between pb-6 pt-8">
      <div>
        <div className="mb-1 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-red-600" />
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl" style={{ fontFamily: "'Orbitron', system-ui" }}>F1 TELEMETRY</h1>
        </div>
        <p className="ml-[19px] text-xs uppercase tracking-[0.25em] text-gray-600">Powered by OpenF1 — Real Race Data</p>
      </div>
      {loading && <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-500"><Loader2 size={12} className="animate-spin" /> Loading…</span>}
    </header>
  );
}
