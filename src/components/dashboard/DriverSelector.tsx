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
      <label className="mb-3 block text-[10px] uppercase tracking-[0.3em] text-slate-700">
        Drivers ({selectedDrivers.length}/4) <span className="text-slate-800">- click to compare</span>
      </label>
      <div className="flex flex-wrap gap-2.5">
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
