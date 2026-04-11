import { useMemo, type ReactNode } from 'react';
import { DriverContext, type DriverContextValue } from './driverContextValue';

type DriverProviderProps = DriverContextValue & {
  children: ReactNode;
};

export function DriverProvider({ children, driverNums, driverMap, driverColor }: DriverProviderProps) {
  const value = useMemo(
    () => ({ driverNums, driverMap, driverColor }),
    [driverColor, driverMap, driverNums],
  );

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}
