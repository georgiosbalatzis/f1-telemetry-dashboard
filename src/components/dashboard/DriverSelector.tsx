import type { OpenF1Driver } from '../../api/openf1';
import { DriverChip } from './shared';

type Props = {
  drivers: OpenF1Driver[];
  selectedDrivers: number[];
  onToggle: (driverNumber: number) => void;
};

export function DriverSelector({ drivers, selectedDrivers, onToggle }: Props) {
  if (drivers.length === 0) return null;

  return (
    <div className="mb-5">
      <label className="mb-3 block text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-dim)]">
        Drivers ({selectedDrivers.length}/4) <span className="text-[color:var(--text-faint)]">- click to compare</span>
      </label>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {drivers.map((driver) => (
          <DriverChip
            key={driver.driver_number}
            driver={driver}
            selected={selectedDrivers.includes(driver.driver_number)}
            onClick={() => onToggle(driver.driver_number)}
          />
        ))}
      </div>
    </div>
  );
}
