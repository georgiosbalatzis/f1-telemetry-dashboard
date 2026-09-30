import { useState, memo } from 'react';
import type { OpenF1Driver } from '../../api/openf1';
import { teamColor } from '../../constants/colors';
import { copy } from '../../copy';
import { DriverChip } from './shared';

type Props = {
  drivers: OpenF1Driver[];
  selectedDrivers: number[];
  onToggle: (driverNumber: number) => void;
  embedMode?: boolean;
};

/** The driver field of the scope bar: selected chips, an add button, and the roster it opens. Render inside the scope grid. */
export const DriverSelector = memo(function DriverSelector({ drivers, selectedDrivers, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  if (drivers.length === 0) return null;
  return (
    <>
      <div className="scope-field scope-drivers" role="group" aria-label={copy.scope.drivers}>
        <span className="field-label">{copy.scope.drivers} · {selectedDrivers.length} / 4</span>
        <div className="drivers-row">
          <div className="selected-drivers">
            {selectedDrivers.map((number) => {
              const driver = drivers.find((item) => item.driver_number === number);
              return <span key={number} className="selected-driver"><i style={{ background: teamColor(driver?.team_colour) }} /><strong>{driver?.name_acronym || `#${number}`}</strong></span>;
            })}
          </div>
          <button type="button" className="add-driver" aria-expanded={open} aria-controls="driver-roster" onClick={() => setOpen((value) => !value)}>
            {open ? copy.scope.close : copy.scope.add}
          </button>
        </div>
      </div>
      {open && (
        <div id="driver-roster" className="driver-roster">
          <p className="roster-help">{copy.scope.rosterHelp}</p>
          <div className="driver-options">
            {drivers.map((driver) => <DriverChip key={driver.driver_number} driver={driver} selected={selectedDrivers.includes(driver.driver_number)} onClick={() => onToggle(driver.driver_number)} />)}
          </div>
        </div>
      )}
    </>
  );
});
