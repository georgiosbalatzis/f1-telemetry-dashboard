import { useEffect, useMemo } from 'react';
import type { OpenF1Driver, OpenF1Lap, OpenF1Meeting, OpenF1Session, OpenF1SessionResult } from '../api/openf1';
import type { FetchState } from './useOpenF1';
import type { SelectOption } from '../components/dashboard/types';

type Params = {
  meetings: OpenF1Meeting[] | null;
  sessions: OpenF1Session[] | null;
  drivers: OpenF1Driver[] | null;
  sessionResults: OpenF1SessionResult[] | null;
  sessionResultsLoading: boolean;
  lapStates: Array<FetchState<OpenF1Lap[]>>;
  circuit: string | null;
  sessionKey: number | null;
  driverNums: number[];
  lapNum: number;
  driverSelectionAuto: boolean;
  lapSelectionAuto: boolean;
  setCircuit: (circuit: string) => void;
  setSessionKey: (sessionKey: number) => void;
  setDriverNums: (driverNums: number[]) => void;
  setLapNum: (lapNum: number) => void;
};

function getPreferredMeetingList(meetings: OpenF1Meeting[]) {
  const now = Date.now();
  const completedMeetings = meetings.filter((meeting) => {
    const endTime = Date.parse(meeting.date_end);
    return Number.isFinite(endTime) && endTime <= now;
  });
  const pool = (completedMeetings.length > 0 ? completedMeetings : meetings).slice();
  pool.sort((left, right) => Date.parse(right.date_end) - Date.parse(left.date_end));
  return pool;
}

function getPreferredRaceSession(sessions: OpenF1Session[]) {
  const sortedSessions = sessions.slice().sort((left, right) => Date.parse(left.date_start) - Date.parse(right.date_start));
  return (
    sortedSessions.find((session) => session.session_type.toLowerCase() === 'race' && session.session_name.toLowerCase() === 'race')
    || sortedSessions.find((session) => session.session_type.toLowerCase() === 'race')
    || sortedSessions.find((session) => session.session_name.toLowerCase().includes('race'))
    || sortedSessions[sortedSessions.length - 1]
    || null
  );
}

export function useDashboardSelectionData({
  meetings,
  sessions,
  drivers,
  sessionResults,
  sessionResultsLoading,
  lapStates,
  circuit,
  sessionKey,
  driverNums,
  lapNum,
  driverSelectionAuto,
  lapSelectionAuto,
  setCircuit,
  setSessionKey,
  setDriverNums,
  setLapNum,
}: Params) {
  const circuitOptions = useMemo<SelectOption<string>[]>(() => {
    if (!meetings?.length) return [];
    const seen = new Set<string>();
    return getPreferredMeetingList(meetings)
      .filter((meeting) => {
        if (seen.has(meeting.circuit_short_name)) return false;
        seen.add(meeting.circuit_short_name);
        return true;
      })
      .map((meeting) => ({ v: meeting.circuit_short_name, l: `${meeting.circuit_short_name} — ${meeting.country_name}` }));
  }, [meetings]);

  const sessionOptions = useMemo<SelectOption<number>[]>(() => {
    if (!sessions?.length) return [];
    return sessions
      .slice()
      .sort((left, right) => Date.parse(left.date_start) - Date.parse(right.date_start))
      .map((session) => ({ v: session.session_key, l: session.session_name }));
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

  const preferredDriverNums = useMemo(() => {
    return (sessionResults || [])
      .filter((result) => typeof result.position === 'number' && !result.dsq && !result.dns)
      .sort((left, right) => left.position - right.position)
      .slice(0, 2)
      .map((result) => result.driver_number);
  }, [sessionResults]);

  const preferredWinnerNumber = preferredDriverNums[0] ?? null;
  const preferredWinnerLaps = useMemo(
    () => (preferredWinnerNumber != null ? allLaps[preferredWinnerNumber] || [] : []),
    [allLaps, preferredWinnerNumber],
  );
  const preferredLapNum = useMemo(() => {
    const fastestWinnerLap = preferredWinnerLaps
      .filter((lap) => !lap.is_pit_out_lap && lap.lap_duration != null)
      .sort((left, right) => (left.lap_duration ?? Number.POSITIVE_INFINITY) - (right.lap_duration ?? Number.POSITIVE_INFINITY))[0];

    return fastestWinnerLap?.lap_number
      ?? (lapOptions.includes(2) ? 2 : lapOptions[0] ?? null);
  }, [lapOptions, preferredWinnerLaps]);

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
    if (sessions?.length && !sessionKey) {
      const raceSession = getPreferredRaceSession(sessions);
      if (raceSession) {
        setSessionKey(raceSession.session_key);
      }
    }
  }, [sessionKey, sessions, setSessionKey]);

  useEffect(() => {
    if (driverNums.length === 0) {
      if (preferredDriverNums.length >= 2) {
        setDriverNums(preferredDriverNums);
        return;
      }
      if (!sessionResultsLoading && driverList.length > 0) {
        setDriverNums(driverList.slice(0, 2).map((driver) => driver.driver_number));
      }
    }
  }, [driverList, driverNums.length, preferredDriverNums, sessionResultsLoading, setDriverNums]);

  useEffect(() => {
    if (lapOptions.length === 0) return;

    if (!lapOptions.includes(lapNum)) {
      setLapNum(preferredLapNum ?? lapOptions[0]);
      return;
    }

    if (driverSelectionAuto && lapSelectionAuto && preferredLapNum != null && lapNum !== preferredLapNum) {
      setLapNum(preferredLapNum);
    }
  }, [driverSelectionAuto, lapNum, lapOptions, lapSelectionAuto, preferredLapNum, setLapNum]);

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
