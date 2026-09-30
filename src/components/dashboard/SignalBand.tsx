import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { copy } from '../../copy';

type ComparisonDriver = { driverNumber: number; name: string; status: string; retry?: (() => void) | null };

/** Full-bleed status line under the hero: source, comparison, lap, and every loading / partial-data message. */
export const SignalBand = memo(function SignalBand({ loading, feedback, lapNum, totalLaps, drivers }: {
  loading: boolean;
  feedback: string | null;
  lapNum: number;
  totalLaps: number | null;
  drivers: ComparisonDriver[];
}) {
  const failed = drivers.filter((driver) => driver.status !== 'Loaded');
  return (
    <div className="signal-band">
      <div className="page-shell signal-band-inner">
        <span className="signal-live">{copy.band.live}</span>
        {drivers.length > 0 && <><span className="signal-sep" aria-hidden="true" /><span>{drivers.map((driver) => driver.name).join(' vs ')}</span></>}
        <span className="signal-sep" aria-hidden="true" /><span>{copy.band.lap(lapNum, totalLaps ?? 0)}</span>
        <p className="session-status" role="status">
          {feedback || (loading ? <><Loader2 size={12} className="animate-spin" /> {copy.band.loading}</> : null)}
        </p>
        {failed.length > 0 && (
          <p className="signal-partial" role="status">
            {copy.band.partial(drivers.length - failed.length, drivers.length)}
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
