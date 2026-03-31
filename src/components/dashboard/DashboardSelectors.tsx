import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { AccentChip } from './shared';
import type { SelectOption } from './types';

type SummaryPill = {
  label: string;
  driver: string;
  detail: string;
  tone: 'blue' | 'purple' | 'amber';
};

type QuickChip = {
  label: string;
  tone: 'neutral' | 'blue' | 'purple' | 'amber';
};

type Props = {
  year: number;
  circuit: string | null;
  sessionKey: number | null;
  lapNum: number;
  totalLaps: number | null;
  yearOptions: number[];
  circuitOptions: SelectOption<string>[];
  sessionOptions: SelectOption<number>[];
  lapOptions: number[];
  meetingsLoading: boolean;
  sessionsLoading: boolean;
  lapsLoading: boolean;
  summaryPills: SummaryPill[];
  quickChips: QuickChip[];
  canStepBackward: boolean;
  canStepForward: boolean;
  onYearChange: (year: number) => void;
  onCircuitChange: (circuit: string) => void;
  onSessionChange: (sessionKey: number) => void;
  onLapChange: (lapNum: number) => void;
  onStepLap: (direction: -1 | 1) => void;
};

export function DashboardSelectors({
  year,
  circuit,
  sessionKey,
  lapNum,
  totalLaps,
  yearOptions,
  circuitOptions,
  sessionOptions,
  lapOptions,
  meetingsLoading,
  sessionsLoading,
  lapsLoading,
  summaryPills,
  quickChips,
  canStepBackward,
  canStepForward,
  onYearChange,
  onCircuitChange,
  onSessionChange,
  onLapChange,
  onStepLap,
}: Props) {
  return (
    <div className="mb-6">
      <div className="dashboard-panel rounded-[28px] p-4 sm:p-5">
        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[200px_minmax(0,1fr)]">
          <div className="relative overflow-hidden rounded-[24px] border border-[#ff8b5d]/20 bg-[linear-gradient(145deg,rgba(255,83,54,0.18),rgba(255,179,71,0.06)_48%,rgba(255,255,255,0.02)_100%)] p-4 shadow-[0_22px_50px_-30px_rgba(255,83,54,0.36)] sm:p-5">
            <div className="absolute inset-x-0 top-0 h-px bg-white/25 opacity-30" />
            <div className="text-[10px] uppercase tracking-[0.32em] text-[#ffd7ab]">Lap Focus</div>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-black tracking-tight text-white sm:text-6xl">{lapNum}</span>
              <span className="mb-2 text-base font-medium text-white/65 sm:text-lg">/ {totalLaps ?? '—'}</span>
            </div>
            <div className="mt-2 text-sm text-white/70">
              Current telemetry lens for comparison, strategy, and radio context.
            </div>
          </div>

          <div className="space-y-4">
            <div className="dashboard-card rounded-[24px] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-dim)]">Session Controls</div>
                  <div className="mt-1 text-sm text-[color:var(--text-muted)]">Move between season, session, and lap focus without losing comparison context.</div>
                </div>
              </div>
              <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-dim)]">Season</label>
                <div className="relative">
                  <select value={year} onChange={(event) => onYearChange(+event.target.value)} className="dashboard-select">
                    {yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <ChevronDown size={14} className="dashboard-select-icon" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-dim)]">Grand Prix</label>
                <div className="relative">
                  <select value={circuit || ''} onChange={(event) => onCircuitChange(event.target.value)} disabled={!circuitOptions.length} className="dashboard-select">
                    {meetingsLoading && <option>Loading circuits…</option>}
                    {!meetingsLoading && circuitOptions.length === 0 && <option>No data for {year}</option>}
                    {circuitOptions.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}
                  </select>
                  <ChevronDown size={14} className="dashboard-select-icon" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-dim)]">Session</label>
                <div className="relative">
                  <select value={sessionKey || ''} onChange={(event) => onSessionChange(+event.target.value)} disabled={!sessionOptions.length} className="dashboard-select">
                    {sessionsLoading && <option>Loading sessions…</option>}
                    {!sessionsLoading && sessionOptions.length === 0 && <option>Select a GP first</option>}
                    {sessionOptions.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}
                  </select>
                  <ChevronDown size={14} className="dashboard-select-icon" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-dim)]">
                  Lap {lapsLoading && <Loader2 size={10} className="ml-1 inline animate-spin" />}
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={() => onStepLap(-1)} disabled={!canStepBackward} className="dashboard-nav-button">
                    <ChevronLeft size={14} />
                  </button>
                  <div className="relative flex-1">
                    <select value={lapNum} onChange={(event) => onLapChange(+event.target.value)} disabled={!lapOptions.length} className="dashboard-select">
                      {lapOptions.length === 0 && <option>Select drivers first</option>}
                      {lapOptions.map((option) => <option key={option} value={option}>Lap {option}</option>)}
                    </select>
                    <ChevronDown size={14} className="dashboard-select-icon" />
                  </div>
                  <button onClick={() => onStepLap(1)} disabled={!canStepForward} className="dashboard-nav-button">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              </div>
            </div>

            {summaryPills.length > 0 && (
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide xl:mx-0 xl:flex-wrap xl:overflow-visible xl:px-0 xl:pb-0">
                {summaryPills.map((pill) => (
                  <div key={`${pill.label}-${pill.driver}`} className="dashboard-pill shrink-0 rounded-[999px] px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                    <span className={pill.tone === 'blue' ? 'text-cyan-300' : pill.tone === 'purple' ? 'text-violet-300' : 'text-amber-300'}>{pill.label}</span>{' '}
                    <span className="text-[color:var(--text-strong)]">{pill.driver}</span>{' '}
                    <span className="font-mono">{pill.detail}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-[color:var(--line)] pt-3">
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
                {quickChips.map((chip) => (
                  <AccentChip key={chip.label} label={chip.label} tone={chip.tone} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
