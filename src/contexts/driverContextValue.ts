import { createContext } from 'react';
import type { OpenF1Driver } from '../api/openf1';

export type DriverContextValue = {
  driverNums: number[];
  driverMap: Record<number, OpenF1Driver>;
  driverColor: (driverNumber: number) => string;
};

export const DriverContext = createContext<DriverContextValue | null>(null);
