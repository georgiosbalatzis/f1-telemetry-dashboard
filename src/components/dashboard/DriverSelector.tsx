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
    <div className="mb-6">
      <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-gray-600">Drivers <span className="text-gray-700">(up to 4)</span></label>
      <div className="flex flex-wrap gap-2">
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
