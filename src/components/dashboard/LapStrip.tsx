import { useMemo, useRef, type KeyboardEvent, memo } from 'react';
import type { OpenF1Lap } from '../../api/openf1';
import { copy } from '../../copy';
import { lapBars } from './lapStripUtils';

const fmt = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds - minutes * 60).toFixed(1).padStart(4, '0')}`;
};

/** One bar per lap of the reference driver; taller = quicker. Click or use the arrow keys to pick the lap. */
// One button per lap: F1 races run at most ~80 laps, which keeps the strip inside the 80-button budget.
export const LapStrip = memo(function LapStrip({ driverName, laps, safetyCar, lapNum, onSelect, pending = false }: {
  driverName: string;
  laps: OpenF1Lap[];
  safetyCar: Set<number>;
  lapNum: number;
  onSelect: (lap: number) => void;
  /** Laps are still loading: render an empty strip of the same height so the page below does not jump. */
  pending?: boolean;
}) {
  const bars = useMemo(() => lapBars(laps, safetyCar), [laps, safetyCar]);
  const group = useRef<HTMLDivElement>(null);
  if (bars.length < 2) {
    return pending ? (
      <section className="lap-strip" aria-hidden="true">
        <div className="lap-strip-head"><span className="section-label">&nbsp;</span><span className="lap-strip-key">&nbsp;</span></div>
        <div className="lap-strip-bars" />
      </section>
    ) : null;
  }

  const move = (event: KeyboardEvent) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = bars.findIndex((bar) => bar.lap === lapNum);
    const next = bars[Math.min(bars.length - 1, Math.max(0, index + step))];
    onSelect(next.lap);
    window.requestAnimationFrame(() => group.current?.querySelector<HTMLElement>(`[data-lap="${next.lap}"]`)?.focus());
  };

  return (
    <section className="lap-strip" aria-label={copy.lapStrip.title(driverName)}>
      <div className="lap-strip-head">
        <span className="section-label">{copy.lapStrip.title(driverName)}</span>
        <span className="lap-strip-key">
          {bars.some((bar) => bar.state === 'sc') && <span data-state="sc">{copy.lapStrip.safetyCar}</span>}
          <span data-state="selected">{copy.lapStrip.selected(lapNum)}</span>
        </span>
      </div>
      <div className="lap-strip-bars" role="group" aria-label={copy.lapStrip.title(driverName)} ref={group} onKeyDown={move}>
        {bars.map((bar) => {
          const note = bar.state === 'sc' ? copy.lapStrip.safetyCar : bar.state === 'pit' ? copy.lapStrip.pit : null;
          return (
            <button
              key={bar.lap} type="button" data-lap={bar.lap} data-state={bar.state}
              aria-pressed={bar.lap === lapNum} tabIndex={bar.lap === lapNum ? 0 : -1}
              aria-label={copy.lapStrip.bar(bar.lap, bar.duration != null ? fmt(bar.duration) : null, note)}
              onClick={() => onSelect(bar.lap)}
            ><span style={{ height: `${bar.height}%` }} /></button>
          );
        })}
      </div>
    </section>
  );
});
