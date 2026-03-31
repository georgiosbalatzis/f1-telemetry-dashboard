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

  if (embedMode) {
    return (
      <div className="mb-3">
        <div className="dashboard-card rounded-[18px] p-3">
          <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.18em] text-[color:var(--text-dim)]">
                Comparison Drivers
              </label>
              <p className="mt-1 text-[11px] leading-[1.45] text-[color:var(--text-muted)]">
                Select up to four drivers for the active comparison set.
              </p>
            </div>
            <span className="dashboard-embed-chip rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-[color:var(--text-soft)]">
              {selectedDrivers.length}/4 active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {drivers.map((driver) => (
              <DriverChip
                key={driver.driver_number}
                driver={driver}
                selected={selectedDrivers.includes(driver.driver_number)}
                compact
                stacked
                onClick={() => onToggle(driver.driver_number)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="sm:hidden">
        <div className="dashboard-card rounded-[16px] p-3">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <label className="block text-[9px] uppercase tracking-[0.18em] text-[color:var(--text-dim)]">
              Comparison Drivers
            </label>
            <span className="dashboard-embed-chip rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-[color:var(--text-soft)]">
              {selectedDrivers.length}/4 active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {drivers.map((driver) => (
              <DriverChip
                key={driver.driver_number}
                driver={driver}
                selected={selectedDrivers.includes(driver.driver_number)}
                compact
                onClick={() => onToggle(driver.driver_number)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="hidden sm:block">
        <label className="mb-2.5 block text-[10px] uppercase tracking-[0.22em] text-[color:var(--text-dim)]">
          Drivers ({selectedDrivers.length}/4) <span className="text-[color:var(--text-faint)]">- click to compare</span>
        </label>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
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
    </div>
  );
}
