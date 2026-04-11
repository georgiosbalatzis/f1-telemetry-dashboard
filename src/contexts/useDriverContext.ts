import { useContext } from 'react';
import { DriverContext } from './driverContextValue';

export function useDriverContext() {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriverContext must be used within DriverProvider');
  }
  return context;
}
