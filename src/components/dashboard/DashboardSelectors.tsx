import { ChevronDown, Loader2 } from 'lucide-react';
import type { SelectOption } from './types';

type Props = {
  year: number;
  circuit: string | null;
  sessionKey: number | null;
  lapNum: number;
  yearOptions: number[];
  circuitOptions: SelectOption<string>[];
  sessionOptions: SelectOption<number>[];
  lapOptions: number[];
  meetingsLoading: boolean;
  sessionsLoading: boolean;
  lapsLoading: boolean;
  onYearChange: (year: number) => void;
  onCircuitChange: (circuit: string) => void;
  onSessionChange: (sessionKey: number) => void;
  onLapChange: (lapNum: number) => void;
};

export function DashboardSelectors({
  year,
  circuit,
  sessionKey,
  lapNum,
  yearOptions,
  circuitOptions,
  sessionOptions,
  lapOptions,
  meetingsLoading,
  sessionsLoading,
  lapsLoading,
  onYearChange,
  onCircuitChange,
  onSessionChange,
  onLapChange,
}: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-gray-600">Season</label>
        <div className="relative">
          <select value={year} onChange={(event) => onYearChange(+event.target.value)} className="w-full cursor-pointer appearance-none rounded-md border border-white/[0.06] bg-[#12121f] px-3 py-2 text-sm text-gray-200 focus:border-red-500/50 focus:outline-none">
            {yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-gray-600">Grand Prix</label>
        <div className="relative">
          <select value={circuit || ''} onChange={(event) => onCircuitChange(event.target.value)} disabled={!circuitOptions.length} className="w-full cursor-pointer appearance-none rounded-md border border-white/[0.06] bg-[#12121f] px-3 py-2 text-sm text-gray-200 focus:border-red-500/50 focus:outline-none disabled:cursor-not-allowed">
            {meetingsLoading && <option>Loading circuits…</option>}
            {!meetingsLoading && circuitOptions.length === 0 && <option>No data for {year}</option>}
            {circuitOptions.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-gray-600">Session</label>
        <div className="relative">
          <select value={sessionKey || ''} onChange={(event) => onSessionChange(+event.target.value)} disabled={!sessionOptions.length} className="w-full cursor-pointer appearance-none rounded-md border border-white/[0.06] bg-[#12121f] px-3 py-2 text-sm text-gray-200 focus:border-red-500/50 focus:outline-none disabled:cursor-not-allowed">
            {sessionsLoading && <option>Loading sessions…</option>}
            {!sessionsLoading && sessionOptions.length === 0 && <option>Select a GP first</option>}
            {sessionOptions.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-gray-600">
          Lap {lapsLoading && <Loader2 size={10} className="ml-1 inline animate-spin" />}
        </label>
        <div className="relative">
          <select value={lapNum} onChange={(event) => onLapChange(+event.target.value)} disabled={!lapOptions.length} className="w-full cursor-pointer appearance-none rounded-md border border-white/[0.06] bg-[#12121f] px-3 py-2 text-sm text-gray-200 focus:border-red-500/50 focus:outline-none disabled:cursor-not-allowed">
            {lapOptions.length === 0 && <option>Select drivers first</option>}
            {lapOptions.map((option) => <option key={option} value={option}>Lap {option}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
        </div>
      </div>
    </div>
  );
}
