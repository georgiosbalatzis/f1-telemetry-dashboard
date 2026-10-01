import { useMemo, type ReactNode } from 'react';
import { DriverContext, type DriverContextValue, type DriverDash } from './driverContextValue';

type DriverProviderProps = DriverContextValue & {
  children: ReactNode;
};

const LINE_DASH = [undefined, '10 4', '2 4', '10 4 2 4'];
const BRAKE_DASH = ['6 4', '10 3 2 3', '2 3', '10 3 2 3 2 3'];

export function DriverProvider({ children, driverNums, driverMap, driverColor }: DriverProviderProps) {
  const value = useMemo(() => {
    // A driver's place among the drivers sharing their team colour (by number), computed once per driver map.
    const teamIndex: Record<number, number> = {};
    const byTeam = new Map<string, number[]>();
    for (const driver of Object.values(driverMap)) {
      byTeam.set(driver.team_colour, [...(byTeam.get(driver.team_colour) ?? []), driver.driver_number]);
    }
    byTeam.forEach((numbers) => numbers.sort((a, b) => a - b).forEach((number, index) => { teamIndex[number] = index; }));
    const driverDash: DriverDash = (driverNumber, channel) => {
      const index = (teamIndex[driverNumber] ?? 0) % 4;
      return channel === 'brake' ? BRAKE_DASH[index] : LINE_DASH[index];
    };
    return { driverNums, driverMap, driverColor, driverDash };
  }, [driverColor, driverMap, driverNums]);

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}
