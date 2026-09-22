import { useCallback, useContext } from 'react';
import { DriverContext } from './driverContextValue';

export function useDriverContext() {
  const context = useContext(DriverContext);
  const driverDash = useCallback((driverNumber: number, channel?: 'brake') => {
    const driver = context?.driverMap[driverNumber];
    const teammates = Object.values(context?.driverMap ?? {})
      .filter((other) => other.team_colour === driver?.team_colour)
      .sort((a, b) => a.driver_number - b.driver_number);
    const index = Math.max(0, teammates.findIndex((other) => other.driver_number === driverNumber));
    return channel === 'brake'
      ? ['6 4', '10 3 2 3', '2 3', '10 3 2 3 2 3'][index % 4]
      : [undefined, '10 4', '2 4', '10 4 2 4'][index % 4];
  }, [context]);
  if (!context) {
    throw new Error('useDriverContext must be used within DriverProvider');
  }
  return { ...context, driverDash };
}
