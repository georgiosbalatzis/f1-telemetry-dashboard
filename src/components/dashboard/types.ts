export type Tab = 'telemetry' | 'tires' | 'energy' | 'radio' | 'incidents' | 'weather';

export type SelectOption<T extends string | number> = {
  v: T;
  l: string;
};

export type SpeedPoint = {
  idx: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  drs: number;
  rpm: number;
};

export type ComparisonPoint = {
  progress: number;
  [key: string]: number | undefined;
};

export type SectorRow = {
  name: string;
  color: string;
  s1?: number | null;
  s2?: number | null;
  s3?: number | null;
  total?: number | null;
  i1?: number | null;
  i2?: number | null;
  st?: number | null;
};

export type WeatherRadarPoint = {
  subject: string;
  value: number;
};

export type DriverLapSummary = {
  driverNumber: number;
  name: string;
  color: string;
  lapTime: number | null;
  gapToLeader: number | null;
  topSpeed: number | null;
  avgSpeed: number | null;
  avgThrottle: number | null;
  avgBrake: number | null;
  peakRpm: number | null;
  peakGear: number | null;
  drsOpenPct: number | null;
};

export type WeatherTrendPoint = {
  time: string;
  air: number;
  track: number;
  humidity: number;
  wind: number;
};
