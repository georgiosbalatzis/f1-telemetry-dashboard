import type { OpenF1Driver } from '../../api/openf1';
import { DriverChip } from './shared';

type Props = {
  drivers: OpenF1Driver[];
  selectedDrivers: number[];
  onToggle: (driverNumber: number) => void;
  embedMode?: boolean;
};

export function DriverSelector({ drivers, selectedDrivers, onToggle, embedMode = false }: Props) {
  if (drivers.length === 0) return null;

  return (
    <div className={embedMode ? 'mb-4' : 'mb-5'}>
      <label className={embedMode ? 'mb-2 block text-[9px] uppercase tracking-[0.22em] text-[color:var(--text-dim)]' : 'mb-3 block text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-dim)]'}>
        Drivers ({selectedDrivers.length}/4) <span className="text-[color:var(--text-faint)]">{embedMode ? '- tap to compare' : '- click to compare'}</span>
      </label>
      <div className={embedMode ? '-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide sm:mx-0 sm:px-0' : '-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0'}>
        {drivers.map((driver) => (
          <DriverChip
            key={driver.driver_number}
            driver={driver}
            selected={selectedDrivers.includes(driver.driver_number)}
            compact={embedMode}
            onClick={() => onToggle(driver.driver_number)}
          />
        ))}
      </div>
    </div>
  );
}
