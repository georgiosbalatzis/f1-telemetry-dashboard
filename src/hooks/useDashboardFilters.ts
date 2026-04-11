import { useCallback, useState } from 'react';
import type { Tab } from '../components/dashboard/types';

export type DashboardFilterSnapshot = {
  year: number;
  circuit: string | null;
  sessionKey: number | null;
  driverNums: number[];
  lapNum: number;
  tab: Tab;
};

const VALID_YEAR_RANGE = [2023, new Date().getFullYear()] as const;
const VALID_DRIVER_RANGE = [1, 99] as const;
const VALID_LAP_RANGE = [1, 200] as const;
const VALID_CIRCUIT_PATTERN = /^[A-Za-z0-9 ._'-]{1,80}$/;
const VALID_TABS: Tab[] = ['telemetry', 'tires', 'energy', 'trackmap', 'positions', 'intervals', 'radio', 'incidents', 'weather', 'broadcast'];

function parseBoundedInt(value: string | null, min: number, max: number) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function parseYear(value: string | null) {
  return parseBoundedInt(value, VALID_YEAR_RANGE[0], VALID_YEAR_RANGE[1]);
}

function parseDriverNumber(value: string | null) {
  return parseBoundedInt(value, VALID_DRIVER_RANGE[0], VALID_DRIVER_RANGE[1]);
}

function parseSessionKey(value: string | null) {
  return parseBoundedInt(value, 1, Number.MAX_SAFE_INTEGER);
}

function parseLapNumber(value: string | null) {
  return parseBoundedInt(value, VALID_LAP_RANGE[0], VALID_LAP_RANGE[1]);
}

function parseCircuit(value: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return VALID_CIRCUIT_PATTERN.test(trimmed) ? trimmed : null;
}

function parseDriverNumbers(value: string | null) {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => parseDriverNumber(part))
    .filter((part): part is number => part != null)
    .filter((part, index, all) => all.indexOf(part) === index)
    .slice(0, 4);
}

function parseTab(value: string | null): Tab | null {
  return value && VALID_TABS.includes(value as Tab) ? value as Tab : null;
}

function readInitialSnapshot(): Partial<DashboardFilterSnapshot> {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  return {
    year: parseYear(params.get('year')) ?? undefined,
    circuit: parseCircuit(params.get('circuit')),
    sessionKey: parseSessionKey(params.get('session')),
    driverNums: parseDriverNumbers(params.get('drivers')),
    lapNum: parseLapNumber(params.get('lap')) ?? undefined,
    tab: parseTab(params.get('tab')) ?? undefined,
  };
}

export function useDashboardFilters() {
  const initial = readInitialSnapshot();
  const hasInitialDrivers = (initial.driverNums?.length ?? 0) > 0;
  const hasInitialLap = initial.lapNum != null;

  const [year, setYear] = useState(initial.year ?? new Date().getFullYear());
  const [circuit, setCircuit] = useState<string | null>(initial.circuit ?? null);
  const [sessionKey, setSessionKey] = useState<number | null>(initial.sessionKey ?? null);
  const [driverNums, setDriverNumsState] = useState<number[]>(initial.driverNums ?? []);
  const [driverSelectionAuto, setDriverSelectionAuto] = useState(!hasInitialDrivers);
  const [lapNum, setLapNumState] = useState(initial.lapNum ?? 1);
  const [lapSelectionAuto, setLapSelectionAuto] = useState(!hasInitialLap);
  const [tab, setTab] = useState<Tab>(initial.tab ?? 'telemetry');

  const setDriverNums = useCallback((nextDriverNums: number[]) => {
    setDriverNumsState(nextDriverNums);
    setDriverSelectionAuto(false);
    setLapSelectionAuto(false);
  }, []);

  const setAutoDriverNums = useCallback((nextDriverNums: number[]) => {
    setDriverNumsState(nextDriverNums);
    setDriverSelectionAuto(true);
  }, []);

  const setLapNum = useCallback((nextLapNum: number) => {
    setLapNumState(nextLapNum);
    setLapSelectionAuto(false);
  }, []);

  const setAutoLapNum = useCallback((nextLapNum: number) => {
    setLapNumState(nextLapNum);
    setLapSelectionAuto(true);
  }, []);

  const handleYearChange = useCallback((nextYear: number) => {
    setYear(nextYear);
    setCircuit(null);
    setSessionKey(null);
    setDriverNumsState([]);
    setDriverSelectionAuto(true);
    setLapNumState(1);
    setLapSelectionAuto(true);
  }, []);

  const handleCircuitChange = useCallback((nextCircuit: string) => {
    setCircuit(nextCircuit);
    setSessionKey(null);
    setDriverNumsState([]);
    setDriverSelectionAuto(true);
    setLapNumState(1);
    setLapSelectionAuto(true);
  }, []);

  const handleSessionChange = useCallback((nextSessionKey: number) => {
    setSessionKey(nextSessionKey);
    setDriverNumsState([]);
    setDriverSelectionAuto(true);
    setLapNumState(1);
    setLapSelectionAuto(true);
  }, []);

  const toggleDriver = useCallback((driverNumber: number) => {
    setDriverSelectionAuto(false);
    setLapSelectionAuto(false);
    setDriverNumsState((prev) => {
      if (prev.includes(driverNumber)) {
        return prev.length > 1 ? prev.filter((num) => num !== driverNumber) : prev;
      }
      return prev.length >= 4 ? [...prev.slice(1), driverNumber] : [...prev, driverNumber];
    });
  }, []);

  const applySnapshot = useCallback((snapshot: Partial<DashboardFilterSnapshot>) => {
    if (snapshot.year != null) setYear(snapshot.year);
    if (snapshot.circuit !== undefined) setCircuit(snapshot.circuit);
    if (snapshot.sessionKey !== undefined) setSessionKey(snapshot.sessionKey);
    if (snapshot.driverNums !== undefined) {
      setDriverNumsState(snapshot.driverNums);
      setDriverSelectionAuto(false);
    }
    if (snapshot.lapNum != null) {
      setLapNumState(snapshot.lapNum);
      setLapSelectionAuto(false);
    }
    if (snapshot.tab != null) setTab(snapshot.tab);
  }, []);

  const snapshot: DashboardFilterSnapshot = {
    year,
    circuit,
    sessionKey,
    driverNums,
    lapNum,
    tab,
  };

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
    setAutoDriverNums,
    setLapNum,
    setAutoLapNum,
    setTab,
    driverSelectionAuto,
    lapSelectionAuto,
    handleYearChange,
    handleCircuitChange,
    handleSessionChange,
    toggleDriver,
    applySnapshot,
    snapshot,
  };
}
