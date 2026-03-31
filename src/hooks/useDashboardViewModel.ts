import { useCallback, useMemo } from 'react';
import type {
  OpenF1CarData,
  OpenF1Driver,
  OpenF1Lap,
  OpenF1Pit,
  OpenF1RaceControl,
  OpenF1Stint,
  OpenF1TeamRadio,
  OpenF1Weather,
} from '../api/openf1';
import type {
  ComparisonPoint,
  DriverLapSummary,
  SectorRow,
  SpeedPoint,
  WeatherRadarPoint,
  WeatherTrendPoint,
} from '../components/dashboard/types';

type Params = {
  allLaps: Record<number, OpenF1Lap[]>;
  driverMap: Record<number, OpenF1Driver>;
  driverNums: number[];
  lapNum: number;
  lapOptions: number[];
  stints: OpenF1Stint[] | null;
  pits: OpenF1Pit[] | null;
  weather: OpenF1Weather[] | null;
  raceControl: OpenF1RaceControl[] | null;
  teamRadio: OpenF1TeamRadio[] | null;
  telemetryByDriver: Record<number, OpenF1CarData[] | null>;
};

export function useDashboardViewModel({
  allLaps,
  driverMap,
  driverNums,
  lapNum,
  lapOptions,
  stints,
  pits,
  weather,
  raceControl,
  teamRadio,
  telemetryByDriver,
}: Params) {
  const primaryTelemetry = telemetryByDriver[driverNums[0]] || null;
  const speedData = useMemo<SpeedPoint[]>(() => {
    if (!primaryTelemetry?.length) return [];
    const step = Math.max(1, Math.floor(primaryTelemetry.length / 250));
    return primaryTelemetry.filter((_, index) => index % step === 0).map((point, index) => ({
      idx: index,
      speed: point.speed,
      throttle: point.throttle,
      brake: -point.brake,
      gear: point.n_gear,
      drs: point.drs >= 10 ? 1 : 0,
      rpm: point.rpm,
    }));
  }, [primaryTelemetry]);

  const lapTimeData = useMemo(() => {
    return lapOptions.map((lap) => {
      const point: Record<string, number | string> = { lap: `L${lap}` };
      driverNums.forEach((driverNumber) => {
        const entry = allLaps[driverNumber]?.find((item) => item.lap_number === lap);
        if (entry?.lap_duration && entry.lap_duration > 0 && !entry.is_pit_out_lap) {
          point[`t_${driverNumber}`] = entry.lap_duration;
        }
      });
      return point;
    });
  }, [allLaps, driverNums, lapOptions]);

  const sectorRows = useMemo<SectorRow[]>(() => {
    return driverNums.map((driverNumber) => {
      const lap = allLaps[driverNumber]?.find((item) => item.lap_number === lapNum);
      const driver = driverMap[driverNumber];
      return {
        name: driver?.name_acronym || `#${driverNumber}`,
        color: `#${driver?.team_colour || '888'}`,
        s1: lap?.duration_sector_1,
        s2: lap?.duration_sector_2,
        s3: lap?.duration_sector_3,
        total: lap?.lap_duration,
        i1: lap?.i1_speed,
        i2: lap?.i2_speed,
        st: lap?.st_speed,
      };
    });
  }, [allLaps, driverMap, driverNums, lapNum]);

  const stintsByDriver = useMemo(() => {
    const grouped: Record<number, OpenF1Stint[]> = {};
    (stints || []).forEach((stint) => {
      (grouped[stint.driver_number] ||= []).push(stint);
    });
    return grouped;
  }, [stints]);

  const filteredPits = useMemo(() => {
    return (pits || [])
      .filter((pit) => driverNums.length === 0 || driverNums.includes(pit.driver_number))
      .sort((a, b) => a.stop_duration - b.stop_duration);
  }, [driverNums, pits]);

  const filteredRadio = useMemo(() => {
    return (teamRadio || []).filter((message) => driverNums.length === 0 || driverNums.includes(message.driver_number));
  }, [driverNums, teamRadio]);

  const raceControlMessages = useMemo(() => raceControl || [], [raceControl]);
  const latestWeather = useMemo(() => weather?.length ? weather[weather.length - 1] : null, [weather]);
  const comparisonSpeedData = useMemo<ComparisonPoint[]>(() => {
    const activeDrivers = driverNums.filter((driverNumber) => (telemetryByDriver[driverNumber] || []).length > 0);
    if (activeDrivers.length < 2) return [];

    const points = 120;
    return Array.from({ length: points }, (_, index) => {
      const progress = Math.round((index / (points - 1)) * 100);
      const point: ComparisonPoint = { progress };
      activeDrivers.forEach((driverNumber) => {
        const telemetry = telemetryByDriver[driverNumber] || [];
        const sampleIndex = Math.min(telemetry.length - 1, Math.round((index / (points - 1)) * (telemetry.length - 1)));
        point[`speed_${driverNumber}`] = telemetry[sampleIndex]?.speed;
      });
      return point;
    });
  }, [driverNums, telemetryByDriver]);

  const lapDeltaData = useMemo(() => {
    return lapOptions.map((lap) => {
      const durations = driverNums
        .map((driverNumber) => ({
          driverNumber,
          lap: allLaps[driverNumber]?.find((entry) => entry.lap_number === lap),
        }))
        .filter((entry) => entry.lap?.lap_duration && !entry.lap.is_pit_out_lap);

      if (durations.length === 0) {
        return { lap: `L${lap}` };
      }

      const bestLap = Math.min(...durations.map((entry) => entry.lap!.lap_duration!));
      const point: Record<string, number | string> = { lap: `L${lap}` };
      durations.forEach((entry) => {
        point[`d_${entry.driverNumber}`] = ((entry.lap!.lap_duration || 0) - bestLap) * 1000;
      });
      return point;
    });
  }, [allLaps, driverNums, lapOptions]);

  const lapSummaries = useMemo<DriverLapSummary[]>(() => {
    const rows = driverNums.map((driverNumber) => {
      const lap = allLaps[driverNumber]?.find((entry) => entry.lap_number === lapNum) || null;
      const telemetry = telemetryByDriver[driverNumber] || [];
      const driver = driverMap[driverNumber];
      const topSpeed = telemetry.length > 0 ? Math.max(...telemetry.map((entry) => entry.speed)) : (lap?.st_speed || lap?.i2_speed || lap?.i1_speed || null);
      const avgSpeed = telemetry.length > 0 ? telemetry.reduce((sum, entry) => sum + entry.speed, 0) / telemetry.length : null;
      const avgThrottle = telemetry.length > 0 ? telemetry.reduce((sum, entry) => sum + entry.throttle, 0) / telemetry.length : null;
      return {
        driverNumber,
        name: driver?.name_acronym || `#${driverNumber}`,
        color: `#${driver?.team_colour || '888'}`,
        lapTime: lap?.lap_duration || null,
        gapToLeader: null,
        topSpeed,
        avgSpeed,
        avgThrottle,
      };
    });

    const validLapTimes = rows.map((row) => row.lapTime).filter((time): time is number => time != null && time > 0);
    const leader = validLapTimes.length > 0 ? Math.min(...validLapTimes) : null;
    return rows
      .map((row) => ({
        ...row,
        gapToLeader: leader != null && row.lapTime != null ? row.lapTime - leader : null,
      }))
      .sort((left, right) => {
        if (left.lapTime == null) return 1;
        if (right.lapTime == null) return -1;
        return left.lapTime - right.lapTime;
      });
  }, [allLaps, driverMap, driverNums, lapNum, telemetryByDriver]);

  const weatherRadar = useMemo<WeatherRadarPoint[]>(() => {
    if (!latestWeather) return [];
    return [
      { subject: 'Air °C', value: Math.min(100, (latestWeather.air_temperature / 40) * 100) },
      { subject: 'Track °C', value: Math.min(100, (latestWeather.track_temperature / 60) * 100) },
      { subject: 'Humidity', value: latestWeather.humidity },
      { subject: 'Wind', value: Math.min(100, (latestWeather.wind_speed / 15) * 100) },
      { subject: 'Rain', value: latestWeather.rainfall ? 100 : 0 },
    ];
  }, [latestWeather]);
  const weatherTrend = useMemo<WeatherTrendPoint[]>(() => {
    if (!weather?.length) return [];
    const step = Math.max(1, Math.floor(weather.length / 24));
    return weather
      .filter((_, index) => index % step === 0)
      .map((entry) => ({
        time: new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        air: entry.air_temperature,
        track: entry.track_temperature,
        humidity: entry.humidity,
        wind: entry.wind_speed,
      }));
  }, [weather]);

  const driverColor = useCallback((driverNumber: number) => `#${driverMap[driverNumber]?.team_colour || '888'}`, [driverMap]);

  return {
    speedData,
    comparisonSpeedData,
    lapTimeData,
    lapDeltaData,
    lapSummaries,
    sectorRows,
    stintsByDriver,
    filteredPits,
    filteredRadio,
    raceControlMessages,
    latestWeather,
    weatherRadar,
    weatherTrend,
    driverColor,
  };
}
