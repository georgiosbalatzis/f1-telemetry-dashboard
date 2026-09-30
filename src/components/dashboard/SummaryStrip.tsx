import { copy } from '../../copy';
import type { DriverLapSummary } from './types';
import { fmtLap } from './utils';

/** Session, each driver's lap time, the gap and top speeds in one strip above the lead chart. */
export function SummaryStrip({ title, subtitle, summaries }: { title: string; subtitle: string; summaries: DriverLapSummary[] }) {
  if (summaries.length === 0) return null;
  const gap = summaries.length > 1 ? Math.max(...summaries.map((summary) => summary.gapToLeader ?? 0)) : null;
  return (
    <div className="summary-strip" aria-label={subtitle}>
      <div className="summary-strip-title">{title}<small>{subtitle}</small></div>
      {summaries.map((summary) => (
        <div key={summary.driverNumber} className="summary-stat">
          <label><i style={{ background: summary.color }} />{summary.name}</label>
          <b>{fmtLap(summary.lapTime)}</b>
          {summary.gapToLeader === 0 && summaries.length > 1 && <small>{copy.summary.reference}</small>}
        </div>
      ))}
      {gap != null && gap > 0 && <div className="summary-stat"><label>{copy.summary.gap}</label><b>+{gap.toFixed(3)}</b></div>}
      <div className="summary-stat"><label>{copy.summary.topSpeed}</label><b>{summaries.map((summary) => summary.topSpeed?.toFixed(0) ?? '—').join(' / ')}</b></div>
    </div>
  );
}
