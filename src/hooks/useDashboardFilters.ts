import { useCallback, useState } from 'react';
import type { Tab } from '../components/dashboard/types';

export function useDashboardFilters() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [circuit, setCircuit] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [driverNums, setDriverNums] = useState<number[]>([]);
  const [lapNum, setLapNum] = useState(1);
  const [tab, setTab] = useState<Tab>('telemetry');

  const handleYearChange = useCallback((nextYear: number) => {
    setYear(nextYear);
    setCircuit(null);
    setSessionKey(null);
    setDriverNums([]);
    setLapNum(1);
  }, []);

  const handleCircuitChange = useCallback((nextCircuit: string) => {
    setCircuit(nextCircuit);
    setSessionKey(null);
    setDriverNums([]);
    setLapNum(1);
  }, []);

  const handleSessionChange = useCallback((nextSessionKey: number) => {
    setSessionKey(nextSessionKey);
    setDriverNums([]);
    setLapNum(1);
  }, []);

  const toggleDriver = useCallback((driverNumber: number) => {
    setDriverNums((prev) => {
      if (prev.includes(driverNumber)) {
        return prev.length > 1 ? prev.filter((num) => num !== driverNumber) : prev;
      }
      return prev.length >= 4 ? [...prev.slice(1), driverNumber] : [...prev, driverNumber];
    });
  }, []);

  return {
    year,
    circuit,
    sessionKey,
    driverNums,
    lapNum,
    tab,
    setCircuit,
    setSessionKey,
    setDriverNums,
    setLapNum,
    setTab,
    handleYearChange,
    handleCircuitChange,
    handleSessionChange,
    toggleDriver,
  };
}
