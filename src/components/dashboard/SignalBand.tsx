import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { copy } from '../../copy';
import { cn } from './utils';

type ComparisonDriver = { driverNumber: number; name: string; status: string; loading?: boolean; known?: boolean; retry?: (() => void) | null };

/** Invisible stand-in of typical width (three-letter codes) while the real names are not known yet. */
const standIn = (count: number) => Array.from({ length: count }, () => 'VER').join(' vs ');

/** Full-bleed status line under the hero: source, comparison, lap, and every loading / partial-data message. */
export const SignalBand = memo(function SignalBand({ loading, feedback, lapNum, totalLaps, drivers, expectDrivers = false, lapsPending = false }: {
  loading: boolean;
  feedback: string | null;
  lapNum: number;
  totalLaps: number | null;
  drivers: ComparisonDriver[];
  /** This view compares drivers, so their names will appear: hold their place while they load. */
  expectDrivers?: boolean;
  /** Lap data is still loading, so the lap total will appear: hold its place. */
  lapsPending?: boolean;
}) {
  // A driver that is still loading is not a failure: no "partial data" line (it would add and then remove a row).
  const failed = drivers.filter((driver) => driver.status !== 'Loaded' && !driver.loading);
  const loaded = drivers.filter((driver) => driver.status === 'Loaded').length;
  return (
    <div className="signal-band">
      <div className="page-shell signal-band-inner">
        <span className="signal-live">{copy.band.live}</span>
        {/* While names or the lap total are still to come, invisible stand-ins of typical width hold their place, so the row
            wraps the same way before and after the data arrives (nothing is reserved on views that never show them). */}
        {(drivers.length > 0 || expectDrivers) && (
          <>
            <span className="signal-sep" aria-hidden="true" />
            {drivers.length > 0 && drivers.every((driver) => driver.known !== false)
              ? <span>{drivers.map((driver) => driver.name).join(' vs ')}</span>
              : <span className="invisible" aria-hidden="true">{standIn(drivers.length || 2)}</span>}
          </>
        )}
        <span className="signal-sep" aria-hidden="true" /><span>{copy.band.lap(lapNum, totalLaps ?? 0)}{lapsPending && !totalLaps && <span className="invisible" aria-hidden="true"> / 99</span>}</span>
        <p className={cn('session-status', !feedback && loading && 'session-loading')} role="status">
          {feedback || (loading ? <><Loader2 size={12} className="animate-spin" aria-hidden="true" /> <span className="sr-only sm:not-sr-only">{copy.band.loading}</span></> : null)}
        </p>
        {failed.length > 0 && (
          <p className="signal-partial" role="status">
            {copy.band.partial(loaded, drivers.length)}
            {failed.map((driver) => (
              <span key={driver.driverNumber} title={driver.status}>
                {' · '}{driver.retry ? <button className="signal-retry" onClick={driver.retry}>{copy.band.retry(driver.name)}</button> : driver.name}
              </span>
            ))}
          </p>
        )}
        <span className="signal-slogan">{copy.band.slogan}</span>
      </div>
    </div>
  );
});
