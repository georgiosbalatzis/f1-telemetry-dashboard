import { createContext } from 'react';
import type { OpenF1Driver } from '../api/openf1';

/** What callers give the provider. */
export type DriverContextValue = {
  driverNums: number[];
  driverMap: Record<number, OpenF1Driver>;
  driverColor: (driverNumber: number) => string;
};

/** Stroke dash pattern that tells teammates apart (same team colour); `brake` picks the brake-trace variant. */
export type DriverDash = (driverNumber: number, channel?: 'brake') => string | undefined;

export const DriverContext = createContext<(DriverContextValue & { driverDash: DriverDash }) | null>(null);
