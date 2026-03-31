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
  Tab,
  WeatherRadarPoint,
  WeatherTrendPoint,
} from '../components/dashboard/types';

type Params = {
  activeTab: Tab;
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

const NORMALIZED_TELEMETRY_POINTS = 120;

function buildNormalizedComparisonData(
  driverNums: number[],
  telemetryByDriver: Record<number, OpenF1CarData[] | null>,
  assignSample: (point: ComparisonPoint, driverNumber: number, sample: OpenF1CarData | undefined) => void,
) {
  const activeDrivers = driverNums.filter((driverNumber) => (telemetryByDriver[driverNumber] || []).length > 0);
  if (activeDrivers.length < 2) return [];

  return Array.from({ length: NORMALIZED_TELEMETRY_POINTS }, (_, index) => {
    const progress = Math.round((index / (NORMALIZED_TELEMETRY_POINTS - 1)) * 100);
    const point: ComparisonPoint = { progress };

    activeDrivers.forEach((driverNumber) => {
      const telemetry = telemetryByDriver[driverNumber] || [];
      const sampleIndex = Math.min(
        telemetry.length - 1,
        Math.round((index / (NORMALIZED_TELEMETRY_POINTS - 1)) * (telemetry.length - 1)),
      );
      assignSample(point, driverNumber, telemetry[sampleIndex]);
    });

    return point;
  });
}

export function useDashboardViewModel({
  activeTab,
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
    if (activeTab !== 'telemetry' && activeTab !== 'energy') return [];
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
  }, [activeTab, primaryTelemetry]);

  const lapTimeData = useMemo(() => {
    if (activeTab !== 'telemetry') return [];
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
  }, [activeTab, allLaps, driverNums, lapOptions]);

  const sectorRows = useMemo<SectorRow[]>(() => {
    if (activeTab !== 'telemetry') return [];
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
  }, [activeTab, allLaps, driverMap, driverNums, lapNum]);

  const stintsByDriver = useMemo(() => {
    if (activeTab !== 'tires') return {};
    const grouped: Record<number, OpenF1Stint[]> = {};
    (stints || []).forEach((stint) => {
      (grouped[stint.driver_number] ||= []).push(stint);
    });
    return grouped;
  }, [activeTab, stints]);

  const filteredPits = useMemo(() => {
    if (activeTab !== 'tires') return [];
    return (pits || [])
      .filter((pit) => driverNums.length === 0 || driverNums.includes(pit.driver_number))
      .sort((a, b) => a.stop_duration - b.stop_duration);
  }, [activeTab, driverNums, pits]);

  const filteredRadio = useMemo(() => {
    if (activeTab !== 'radio') return [];
    return (teamRadio || []).filter((message) => driverNums.length === 0 || driverNums.includes(message.driver_number));
  }, [activeTab, driverNums, teamRadio]);

  const raceControlMessages = useMemo(() => activeTab === 'incidents' ? raceControl || [] : [], [activeTab, raceControl]);
  const latestWeather = useMemo(() => activeTab === 'weather' && weather?.length ? weather[weather.length - 1] : null, [activeTab, weather]);
  const comparisonSpeedData = useMemo<ComparisonPoint[]>(() => {
    if (activeTab !== 'telemetry') return [];
    return buildNormalizedComparisonData(driverNums, telemetryByDriver, (point, driverNumber, sample) => {
      point[`speed_${driverNumber}`] = sample?.speed;
    });
  }, [activeTab, driverNums, telemetryByDriver]);

  const comparisonControlData = useMemo<ComparisonPoint[]>(() => {
    if (activeTab !== 'telemetry') return [];
    return buildNormalizedComparisonData(driverNums, telemetryByDriver, (point, driverNumber, sample) => {
      point[`throttle_${driverNumber}`] = sample?.throttle;
      point[`brake_${driverNumber}`] = sample?.brake != null ? -sample.brake : undefined;
    });
  }, [activeTab, driverNums, telemetryByDriver]);

  const comparisonEnergyData = useMemo<ComparisonPoint[]>(() => {
    if (activeTab !== 'energy') return [];
    return buildNormalizedComparisonData(driverNums, telemetryByDriver, (point, driverNumber, sample) => {
      point[`gear_${driverNumber}`] = sample?.n_gear;
      point[`rpm_${driverNumber}`] = sample?.rpm;
      point[`drs_${driverNumber}`] = sample ? (sample.drs >= 10 ? 1 : 0) : undefined;
    });
  }, [activeTab, driverNums, telemetryByDriver]);

  const lapDeltaData = useMemo(() => {
    if (activeTab !== 'telemetry') return [];
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
  }, [activeTab, allLaps, driverNums, lapOptions]);

  const lapSummaries = useMemo<DriverLapSummary[]>(() => {
    const rows = driverNums.map((driverNumber) => {
      const lap = allLaps[driverNumber]?.find((entry) => entry.lap_number === lapNum) || null;
      const telemetry = telemetryByDriver[driverNumber] || [];
      const driver = driverMap[driverNumber];
      const topSpeed = telemetry.length > 0 ? Math.max(...telemetry.map((entry) => entry.speed)) : (lap?.st_speed || lap?.i2_speed || lap?.i1_speed || null);
      const avgSpeed = telemetry.length > 0 ? telemetry.reduce((sum, entry) => sum + entry.speed, 0) / telemetry.length : null;
      const avgThrottle = telemetry.length > 0 ? telemetry.reduce((sum, entry) => sum + entry.throttle, 0) / telemetry.length : null;
      const avgBrake = telemetry.length > 0 ? telemetry.reduce((sum, entry) => sum + entry.brake, 0) / telemetry.length : null;
      const peakRpm = telemetry.length > 0 ? Math.max(...telemetry.map((entry) => entry.rpm)) : null;
      const peakGear = telemetry.length > 0 ? Math.max(...telemetry.map((entry) => entry.n_gear)) : null;
      const drsOpenPct = telemetry.length > 0
        ? Math.round((telemetry.filter((entry) => entry.drs >= 10).length / telemetry.length) * 100)
        : null;
      return {
        driverNumber,
        name: driver?.name_acronym || `#${driverNumber}`,
        color: `#${driver?.team_colour || '888'}`,
        lapTime: lap?.lap_duration || null,
        gapToLeader: null,
        topSpeed,
        avgSpeed,
        avgThrottle,
        avgBrake,
        peakRpm,
        peakGear,
        drsOpenPct,
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
    if (activeTab !== 'weather') return [];
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
  }, [activeTab, weather]);

  const driverColor = useCallback((driverNumber: number) => `#${driverMap[driverNumber]?.team_colour || '888'}`, [driverMap]);

  return {
    speedData,
    comparisonSpeedData,
    comparisonControlData,
    comparisonEnergyData,
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
