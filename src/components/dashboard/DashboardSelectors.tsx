import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SelectOption } from './types';

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
  year, circuit, sessionKey, lapNum, totalLaps, yearOptions, circuitOptions,
  sessionOptions, lapOptions, meetingsLoading, sessionsLoading, lapsLoading,
  canStepBackward, canStepForward, onYearChange, onCircuitChange, onSessionChange,
  onLapChange, onStepLap, embedMode = false,
}: Props) {
  const controls = (
    <section className="session-scope" aria-label="Session scope">
      <div className="scope-fields">
        <label className="scope-field"><span className="field-label">Season</span>
          <select value={year} onChange={(event) => onYearChange(+event.target.value)} className="dashboard-select">
            {yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="scope-field"><span className="field-label">Grand Prix</span>
          <select value={circuit || ''} onChange={(event) => onCircuitChange(event.target.value)} disabled={!circuitOptions.length} className="dashboard-select">
            {!circuitOptions.length && <option value="">{meetingsLoading ? 'Loading circuits…' : `No data for ${year}`}</option>}
            {circuitOptions.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}
          </select>
        </label>
        <label className="scope-field"><span className="field-label">Session</span>
          <select value={sessionKey || ''} onChange={(event) => onSessionChange(+event.target.value)} disabled={!sessionOptions.length} className="dashboard-select">
            {!sessionOptions.length && <option value="">{sessionsLoading ? 'Loading sessions…' : 'Select a GP first'}</option>}
            {sessionOptions.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}
          </select>
        </label>
        <div className="scope-field">
          <label className="field-label" htmlFor="lap-selection">Lap {totalLaps ? `/ ${totalLaps}` : ''}</label>
          <div className="lap-controls">
            <button aria-label="Previous lap" onClick={() => onStepLap(-1)} disabled={!canStepBackward} className="dashboard-nav-button"><ChevronLeft size={16} /></button>
            <select id="lap-selection" value={lapNum} onChange={(event) => onLapChange(+event.target.value)} disabled={!lapOptions.length} className="dashboard-select">
              {!lapOptions.length && <option>{lapsLoading ? 'Loading…' : 'Select drivers'}</option>}
              {lapOptions.map((option) => <option key={option} value={option}>Lap {option}</option>)}
            </select>
            <button aria-label="Next lap" onClick={() => onStepLap(1)} disabled={!canStepForward} className="dashboard-nav-button"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </section>
  );
  return embedMode ? <details className="embed-scope"><summary className="text-action">Adjust session & lap</summary>{controls}</details> : controls;
}
