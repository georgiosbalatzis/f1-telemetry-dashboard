import type { OpenF1Driver } from '../../api/openf1';
import { teamColor } from '../../constants/colors';
import { DriverChip } from './shared';

type Props = {
  drivers: OpenF1Driver[];
  selectedDrivers: number[];
  onToggle: (driverNumber: number) => void;
  embedMode?: boolean;
};

export function DriverSelector({ drivers, selectedDrivers, onToggle }: Props) {
  if (drivers.length === 0) return null;
  return (
    <section className="comparison-scope" aria-label="Driver comparison">
      <div className="comparison-context">
        <span className="section-label">Compare</span>
        <div className="selected-drivers">
          {selectedDrivers.map((number) => {
            const driver = drivers.find((item) => item.driver_number === number);
            return <span key={number} className="selected-driver"><i style={{ background: teamColor(driver?.team_colour) }} /><strong>{driver?.name_acronym || `#${number}`}</strong><span className="driver-surname">{driver?.last_name}</span></span>;
          })}
        </div>
      </div>
      <details className="driver-roster">
        <summary className="text-action">Edit drivers <span className="text-muted">{selectedDrivers.length}/4</span></summary>
        <p className="roster-help">Choose up to four drivers. A fifth choice replaces the first; keep at least one selected.</p>
        <div className="driver-options">
          {drivers.map((driver) => <DriverChip key={driver.driver_number} driver={driver} selected={selectedDrivers.includes(driver.driver_number)} onClick={() => onToggle(driver.driver_number)} />)}
        </div>
      </details>
    </section>
  );
}
