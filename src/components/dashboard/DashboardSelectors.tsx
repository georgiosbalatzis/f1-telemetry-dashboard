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
  embedMode?: boolean;
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
  embedMode = false,
  onYearChange,
  onCircuitChange,
  onSessionChange,
  onLapChange,
  onStepLap,
}: Props) {
  const labelClass = embedMode
    ? 'mb-1.5 block text-[9px] uppercase tracking-[0.22em] text-[color:var(--text-dim)]'
    : 'mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-dim)]';
  const displayQuickChips = embedMode ? quickChips.slice(0, 3) : quickChips;
  const summaryToneStyles = {
    blue: { color: 'var(--accent)' },
    purple: { color: 'var(--accent-strong)' },
    amber: { color: 'var(--accent-neutral)' },
  } as const;

  const seasonField = (
    <div>
      <label className={labelClass}>Season</label>
      <div className="relative">
        <select value={year} onChange={(event) => onYearChange(+event.target.value)} className="dashboard-select">
          {yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <ChevronDown size={14} className="dashboard-select-icon" />
      </div>
    </div>
  );

  const circuitField = (
    <div>
      <label className={labelClass}>Grand Prix</label>
      <div className="relative">
        <select value={circuit || ''} onChange={(event) => onCircuitChange(event.target.value)} disabled={!circuitOptions.length} className="dashboard-select">
          {meetingsLoading && <option>Loading circuits…</option>}
          {!meetingsLoading && circuitOptions.length === 0 && <option>No data for {year}</option>}
          {circuitOptions.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}
        </select>
        <ChevronDown size={14} className="dashboard-select-icon" />
      </div>
    </div>
  );

  const sessionField = (
    <div>
      <label className={labelClass}>Session</label>
      <div className="relative">
        <select value={sessionKey || ''} onChange={(event) => onSessionChange(+event.target.value)} disabled={!sessionOptions.length} className="dashboard-select">
          {sessionsLoading && <option>Loading sessions…</option>}
          {!sessionsLoading && sessionOptions.length === 0 && <option>Select a GP first</option>}
          {sessionOptions.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}
        </select>
        <ChevronDown size={14} className="dashboard-select-icon" />
      </div>
    </div>
  );

  const lapSelectControl = (
    <div className="relative flex-1">
      <select value={lapNum} onChange={(event) => onLapChange(+event.target.value)} disabled={!lapOptions.length} className="dashboard-select">
        {lapOptions.length === 0 && <option>Select drivers first</option>}
        {lapOptions.map((option) => <option key={option} value={option}>Lap {option}</option>)}
      </select>
      <ChevronDown size={14} className="dashboard-select-icon" />
    </div>
  );

  const lapField = (
    <div>
      <label className={labelClass}>
        Lap {lapsLoading && <Loader2 size={10} className="ml-1 inline animate-spin" />}
      </label>
      <div className="flex items-center gap-2">
        <button onClick={() => onStepLap(-1)} disabled={!canStepBackward} className="dashboard-nav-button">
          <ChevronLeft size={14} />
        </button>
        {lapSelectControl}
        <button onClick={() => onStepLap(1)} disabled={!canStepForward} className="dashboard-nav-button">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );

  const lapSelectField = (
    <div>
      <label className={labelClass}>
        Jump To Lap {lapsLoading && <Loader2 size={10} className="ml-1 inline animate-spin" />}
      </label>
      {lapSelectControl}
    </div>
  );

  const summaryRow = summaryPills.length > 0 ? (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide xl:mx-0 xl:flex-wrap xl:overflow-visible xl:px-0 xl:pb-0">
      {summaryPills.map((pill) => (
        <div
          key={`${pill.label}-${pill.driver}`}
          className={`dashboard-pill shrink-0 rounded-[999px] ${embedMode ? 'px-2.5 py-1 text-[8px] tracking-[0.14em]' : 'px-3.5 py-2 text-[10px] tracking-[0.18em]'} uppercase text-[color:var(--text-muted)]`}
        >
          <span style={summaryToneStyles[pill.tone]}>{pill.label}</span>{' '}
          <span className="text-[color:var(--text-strong)]">{pill.driver}</span>{' '}
          <span className="font-mono">{pill.detail}</span>
        </div>
      ))}
    </div>
  ) : null;

  const quickRow = (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
      {displayQuickChips.map((chip) => (
        <AccentChip key={chip.label} label={chip.label} tone={chip.tone} />
      ))}
    </div>
  );

  if (embedMode) {
    return (
      <div className="mb-5">
        <div className="dashboard-card rounded-[18px] p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="dashboard-embed-focus flex flex-col gap-3 rounded-[18px] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-[0.18em] text-[color:var(--accent)]">Session Focus</div>
                <div className="mt-1.5 flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight text-[color:var(--text-strong)]">{lapNum}</span>
                  <span className="mb-1 text-[11px] font-medium text-[color:var(--text-muted)]">/ {totalLaps ?? '—'} laps</span>
                </div>
                <div className="mt-1 text-[11px] leading-[1.45] text-[color:var(--text-muted)]">
                  Step through the active lap without resetting the comparison.
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button onClick={() => onStepLap(-1)} disabled={!canStepBackward} className="dashboard-nav-button">
                  <ChevronLeft size={14} />
                </button>
                <div className="dashboard-pill rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-soft)]">
                  Lap {lapNum}
                </div>
                <button onClick={() => onStepLap(1)} disabled={!canStepForward} className="dashboard-nav-button">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {(summaryRow || displayQuickChips.length > 0) && (
              <div className="space-y-2">
                {summaryRow}
                <div>{quickRow}</div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {seasonField}
              {circuitField}
              {sessionField}
              {lapSelectField}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 sm:mb-6">
      <div className="sm:hidden">
        <div className="dashboard-card rounded-[16px] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.16em] text-[color:var(--accent)]">Lap Focus</div>
              <div className="mt-2 flex items-end gap-1.5">
                <span className="text-3xl font-black tracking-tight text-[color:var(--text-strong)]">{lapNum}</span>
                <span className="mb-1 text-[11px] font-medium text-[color:var(--text-muted)]">/ {totalLaps ?? '—'}</span>
              </div>
            </div>
            <div className="dashboard-pill rounded-full px-3 py-1.5 text-[9px] uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
              current lap
            </div>
          </div>

          <div className="mt-4">{lapField}</div>

          <div className="mt-4 grid gap-3">
            {seasonField}
            {circuitField}
            {sessionField}
          </div>

          {(summaryRow || quickChips.length > 0) && (
            <div className="mt-4 border-t border-[color:var(--line)] pt-4">
              {summaryRow}
              <div className={summaryRow ? 'mt-3' : ''}>
                {quickRow}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden sm:block">
        <div className="dashboard-card rounded-[16px] p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[164px_minmax(0,1fr)]">
            <div className="dashboard-embed-focus relative overflow-hidden rounded-[16px] p-3.5">
              <div className="absolute inset-x-0 top-0 h-px bg-white/25 opacity-30" />
              <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--accent)]">Lap Focus</div>
              <div className="mt-2.5 flex items-end gap-2">
                <span className="text-4xl font-black tracking-tight text-[color:var(--text-strong)] sm:text-5xl">{lapNum}</span>
                <span className="mb-1.5 text-sm font-medium text-[color:var(--text-muted)] sm:text-base">/ {totalLaps ?? '—'}</span>
              </div>
              <div className="mt-2 text-[12px] leading-[1.45] text-[color:var(--text-muted)]">
                Current telemetry lens.
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-dim)]">Session Controls</div>
                  <div className="mt-1 text-[12px] leading-[1.45] text-[color:var(--text-muted)]">
                    Change season, session, and lap focus without losing comparison state.
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {seasonField}
                  {circuitField}
                  {sessionField}
                  {lapField}
                </div>
              </div>

              {summaryRow}

              <div className="border-t border-[color:var(--line)] pt-3">
                {quickRow}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
