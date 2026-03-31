import { useEffect, useMemo } from 'react';
import type { OpenF1Driver, OpenF1Lap, OpenF1Meeting, OpenF1Session } from '../api/openf1';
import type { FetchState } from './useOpenF1';
import type { SelectOption } from '../components/dashboard/types';

type Params = {
  meetings: OpenF1Meeting[] | null;
  sessions: OpenF1Session[] | null;
  drivers: OpenF1Driver[] | null;
  lapStates: Array<FetchState<OpenF1Lap[]>>;
  circuit: string | null;
  sessionKey: number | null;
  driverNums: number[];
  lapNum: number;
  setCircuit: (circuit: string) => void;
  setSessionKey: (sessionKey: number) => void;
  setDriverNums: (driverNums: number[]) => void;
  setLapNum: (lapNum: number) => void;
};

export function useDashboardSelectionData({
  meetings,
  sessions,
  drivers,
  lapStates,
  circuit,
  sessionKey,
  driverNums,
  lapNum,
  setCircuit,
  setSessionKey,
  setDriverNums,
  setLapNum,
}: Params) {
  const circuitOptions = useMemo<SelectOption<string>[]>(() => {
    if (!meetings?.length) return [];
    const seen = new Set<string>();
    return meetings
      .filter((meeting) => {
        if (seen.has(meeting.circuit_short_name)) return false;
        seen.add(meeting.circuit_short_name);
        return true;
      })
      .map((meeting) => ({ v: meeting.circuit_short_name, l: `${meeting.circuit_short_name} — ${meeting.country_name}` }));
  }, [meetings]);

  const sessionOptions = useMemo<SelectOption<number>[]>(() => {
    if (!sessions?.length) return [];
    return sessions.map((session) => ({ v: session.session_key, l: session.session_name }));
  }, [sessions]);

  const driverList = useMemo(() => drivers || [], [drivers]);

  const driverMap = useMemo(() => {
    const map: Record<number, OpenF1Driver> = {};
    driverList.forEach((driver) => {
      map[driver.driver_number] = driver;
    });
    return map;
  }, [driverList]);

  const allLaps = useMemo(() => {
    const map: Record<number, OpenF1Lap[]> = {};
    const lapSources = lapStates.map((state) => state.data);
    driverNums.forEach((driverNumber, index) => {
      const laps = lapSources[index];
      if (laps?.length) map[driverNumber] = laps;
    });
    return map;
  }, [driverNums, lapStates]);

  const lapOptions = useMemo(() => {
    const lapSet = new Set<number>();
    Object.values(allLaps).forEach((laps) => laps.forEach((lap) => lapSet.add(lap.lap_number)));
    return Array.from(lapSet).sort((a, b) => a - b);
  }, [allLaps]);

  const primaryDriverNumber = driverNums[0];
  const telemetryWindows = useMemo(() => {
    return driverNums.map((driverNumber) => {
      const laps = allLaps[driverNumber] || [];
      const lap = laps.find((item) => item.lap_number === lapNum) || null;
      const nextLap = laps.find((item) => item.lap_number === lapNum + 1) || null;
      return {
        driverNumber,
        lapStart: lap?.date_start || null,
        nextLapStart: nextLap?.date_start || null,
      };
    });
  }, [allLaps, driverNums, lapNum]);
  const primaryLap = useMemo(
    () => (allLaps[primaryDriverNumber] || []).find((lap) => lap.lap_number === lapNum) || null,
    [allLaps, lapNum, primaryDriverNumber],
  );
  const nextPrimaryLap = useMemo(
    () => (allLaps[primaryDriverNumber] || []).find((lap) => lap.lap_number === lapNum + 1) || null,
    [allLaps, lapNum, primaryDriverNumber],
  );

  useEffect(() => {
    if (circuitOptions.length > 0 && !circuit) {
      setCircuit(circuitOptions[0].v);
    }
  }, [circuit, circuitOptions, setCircuit]);

  useEffect(() => {
    if (sessionOptions.length > 0 && !sessionKey) {
      const raceSession = sessionOptions.find((option) => option.l.toLowerCase().includes('race'));
      setSessionKey(raceSession?.v || sessionOptions[sessionOptions.length - 1].v);
    }
  }, [sessionKey, sessionOptions, setSessionKey]);

  useEffect(() => {
    if (driverList.length > 0 && driverNums.length === 0) {
      setDriverNums(driverList.slice(0, 2).map((driver) => driver.driver_number));
    }
  }, [driverList, driverNums.length, setDriverNums]);

  useEffect(() => {
    if (lapOptions.length > 0 && !lapOptions.includes(lapNum)) {
      setLapNum(lapOptions.includes(2) ? 2 : lapOptions[0]);
    }
  }, [lapNum, lapOptions, setLapNum]);

  return {
    circuitOptions,
    sessionOptions,
    driverList,
    driverMap,
    allLaps,
    lapOptions,
    telemetryWindows,
    primaryDriverNumber,
    primaryLapStart: primaryLap?.date_start || null,
    nextPrimaryLapStart: nextPrimaryLap?.date_start || null,
  };
}
