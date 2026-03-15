// ─── Core Domain Types ───────────────────────────────────────────────────────

export interface Driver {
  id: number;
  name: string;
  abbrev: string;
  color: string;
  team: string;
  number: number;
}

export interface TelemetryPoint {
  distance: number;       // 0–1 normalized track position
  speed: number;          // km/h
  throttle: number;       // 0–100 %
  brake: number;          // 0–100 %
  gear: number;
  drs: boolean;
  rpm: number;
  steeringAngle: number;
  lateralG: number;
  longitudinalG: number;
  ersDeployment: number;  // 0–100 %
  ersHarvesting: number;  // 0–100 %
  batteryLevel: number;   // 0–100 %
  fuelRemaining: number;  // kg
}

export interface LapData {
  lapNumber: number;
  lapTime: number;        // seconds
  s1Time: number;
  s2Time: number;
  s3Time: number;
  compound: TireCompound;
  tireAge: number;
  telemetry: TelemetryPoint[];
}

export type TireCompound = 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';

export interface TireCompoundInfo {
  color: string;
  label: string;
  shortLabel: string;
}

export interface PitStop {
  lap: number;
  duration: number;
  compoundIn: TireCompound;
  compoundOut: TireCompound;
}

export interface RadioMessage {
  lap: number;
  timestamp: string;
  from: 'Driver' | 'Engineer';
  type: 'strategy' | 'info' | 'warning' | 'technical' | 'feedback' | 'celebration';
  message: string;
}

export interface Incident {
  lap: number;
  type: string;
  driver1Id: number;
  driver2Id: number | null;
  outcome: string;
  description: string;
}

export interface WeatherConditions {
  label: string;
  airTemp: number;
  trackTemp: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
}

export interface LiveTimingEntry {
  position: number;
  driverId: number;
  gap: string;
  interval: string;
  lastLap: string;
  bestLap: string;
  s1: { time: string; color: SectorColor };
  s2: { time: string; color: SectorColor };
  s3: { time: string; color: SectorColor };
  compound: TireCompound;
  tireAge: number;
}

export type SectorColor = 'purple' | 'green' | 'yellow' | 'red';

export interface CarSetup {
  frontWing: number;
  rearWing: number;
  onThrottleDiff: number;
  offThrottleDiff: number;
  frontCamber: number;
  rearCamber: number;
  frontToe: number;
  rearToe: number;
  frontSuspension: number;
  rearSuspension: number;
  frontAntiRollBar: number;
  rearAntiRollBar: number;
  frontRideHeight: number;
  rearRideHeight: number;
  brakePressure: number;
  brakeBias: number;
}

// ─── UI State Types ──────────────────────────────────────────────────────────

export type DashboardTab = 'telemetry' | 'tires' | 'energy' | 'setup' | 'radio' | 'incidents' | 'weather';

export interface DashboardState {
  selectedDriverIds: number[];
  selectedLap: number;
  selectedYear: number;
  selectedSession: string;
  selectedCircuit: string;
  activeTab: DashboardTab;
  weatherCondition: string;
}
