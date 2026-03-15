import type {
  Driver, TelemetryPoint, LapData, TireCompound, PitStop,
  RadioMessage, Incident, WeatherConditions, LiveTimingEntry,
  CarSetup, SectorColor, TireCompoundInfo
} from '../types/f1';

// ─── Seeded PRNG for stable random data ──────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const DRIVERS: Driver[] = [
  { id: 1, name: 'Max Verstappen', abbrev: 'VER', color: '#3671C6', team: 'Red Bull Racing', number: 1 },
  { id: 11, name: 'Sergio Perez', abbrev: 'PER', color: '#6692FF', team: 'Red Bull Racing', number: 11 },
  { id: 16, name: 'Charles Leclerc', abbrev: 'LEC', color: '#E8002D', team: 'Ferrari', number: 16 },
  { id: 55, name: 'Carlos Sainz', abbrev: 'SAI', color: '#F91536', team: 'Ferrari', number: 55 },
  { id: 44, name: 'Lewis Hamilton', abbrev: 'HAM', color: '#27F4D2', team: 'Mercedes', number: 44 },
  { id: 63, name: 'George Russell', abbrev: 'RUS', color: '#6CD3BF', team: 'Mercedes', number: 63 },
  { id: 4, name: 'Lando Norris', abbrev: 'NOR', color: '#FF8000', team: 'McLaren', number: 4 },
  { id: 81, name: 'Oscar Piastri', abbrev: 'PIA', color: '#F58020', team: 'McLaren', number: 81 },
  { id: 14, name: 'Fernando Alonso', abbrev: 'ALO', color: '#229971', team: 'Aston Martin', number: 14 },
  { id: 10, name: 'Pierre Gasly', abbrev: 'GAS', color: '#2293D1', team: 'Alpine', number: 10 },
];

export const DRIVER_MAP: Record<number, Driver> = Object.fromEntries(DRIVERS.map(d => [d.id, d]));

export const TIRE_COMPOUNDS: Record<TireCompound, TireCompoundInfo> = {
  soft: { color: '#FF3333', label: 'Soft', shortLabel: 'S' },
  medium: { color: '#FFC300', label: 'Medium', shortLabel: 'M' },
  hard: { color: '#EEEEEE', label: 'Hard', shortLabel: 'H' },
  intermediate: { color: '#43B02A', label: 'Intermediate', shortLabel: 'I' },
  wet: { color: '#0067AD', label: 'Wet', shortLabel: 'W' },
};

export const CIRCUITS = [
  'Bahrain', 'Jeddah', 'Melbourne', 'Suzuka', 'Shanghai', 'Miami',
  'Imola', 'Monaco', 'Barcelona', 'Montreal', 'Silverstone', 'Spa',
  'Monza', 'Singapore', 'COTA', 'Mexico City', 'Interlagos', 'Abu Dhabi'
];

export const SESSIONS = ['FP1', 'FP2', 'FP3', 'Qualifying', 'Sprint', 'Race'];
export const YEARS = [2023, 2024, 2025];

export const WEATHER_PRESETS: Record<string, WeatherConditions> = {
  clear: { label: 'Clear', airTemp: 28, trackTemp: 42, humidity: 45, windSpeed: 8, windDirection: 225, precipitation: 0 },
  cloudy: { label: 'Overcast', airTemp: 22, trackTemp: 32, humidity: 62, windSpeed: 12, windDirection: 180, precipitation: 0 },
  lightRain: { label: 'Light Rain', airTemp: 18, trackTemp: 25, humidity: 85, windSpeed: 15, windDirection: 200, precipitation: 25 },
  heavyRain: { label: 'Heavy Rain', airTemp: 15, trackTemp: 20, humidity: 95, windSpeed: 22, windDirection: 210, precipitation: 80 },
};

// ─── Data Generation ─────────────────────────────────────────────────────────

const TELEMETRY_POINTS = 80;
const TOTAL_LAPS = 5;

export function generateTelemetry(driverId: number, lapNumber: number, circuit: string): TelemetryPoint[] {
  const seed = driverId * 10000 + lapNumber * 100 + circuit.charCodeAt(0);
  const rng = mulberry32(seed);
  const points: TelemetryPoint[] = [];
  const skill = 1 - ((driverId % 20) / 100); // higher = faster

  for (let i = 0; i < TELEMETRY_POINTS; i++) {
    const dist = i / TELEMETRY_POINTS;
    // Simulate a lap profile with braking zones
    const cornerPhase = Math.sin(dist * Math.PI * 8 + circuit.charCodeAt(1)) * 0.5 + 0.5;
    const isBraking = cornerPhase < 0.3;
    const isCorner = cornerPhase < 0.5;
    const isStraight = cornerPhase > 0.7;

    const baseSpeed = isStraight ? 290 + rng() * 40 : isCorner ? 120 + rng() * 60 : isBraking ? 160 + rng() * 40 : 220 + rng() * 30;
    const speed = baseSpeed * skill + (rng() - 0.5) * 8;
    const throttle = isStraight ? 95 + rng() * 5 : isCorner ? 30 + rng() * 40 : isBraking ? 5 + rng() * 15 : 60 + rng() * 30;
    const brake = isBraking ? 60 + rng() * 40 : isCorner ? 10 + rng() * 20 : rng() * 5;

    points.push({
      distance: dist,
      speed: Math.max(50, Math.min(350, speed)),
      throttle: Math.max(0, Math.min(100, throttle)),
      brake: Math.max(0, Math.min(100, brake)),
      gear: Math.max(1, Math.min(8, Math.round(speed / 45))),
      drs: isStraight && rng() > 0.6 && lapNumber > 1,
      rpm: Math.min(15000, 4000 + speed * 30 + rng() * 500),
      steeringAngle: isCorner ? (rng() - 0.5) * 180 : (rng() - 0.5) * 20,
      lateralG: isCorner ? (2 + rng() * 3) * (rng() > 0.5 ? 1 : -1) : (rng() - 0.5) * 0.5,
      longitudinalG: isBraking ? -(3 + rng() * 2) : isStraight && throttle > 90 ? 1 + rng() : 0,
      ersDeployment: throttle > 70 ? Math.min(100, 60 + rng() * 40) : rng() * 10,
      ersHarvesting: brake > 20 ? Math.min(100, brake * 0.8 + rng() * 20) : 0,
      batteryLevel: 50 + Math.sin(lapNumber + dist * 3) * 30 + rng() * 15,
      fuelRemaining: Math.max(0, 105 - lapNumber * 1.8 - dist * 1.8 + (driverId % 3) * 0.2),
    });
  }
  return points;
}

export function generateLapData(driverId: number, circuit: string): LapData[] {
  const seed = driverId * 1000 + circuit.charCodeAt(0);
  const rng = mulberry32(seed);
  const laps: LapData[] = [];
  const skill = 1 - ((driverId % 20) / 100);
  const compounds: TireCompound[] = ['soft', 'soft', 'medium', 'medium', 'hard'];

  for (let lap = 1; lap <= TOTAL_LAPS; lap++) {
    const base = 88 + (1 - skill) * 6;
    const variation = (rng() - 0.5) * 1.5;
    const tireDeg = lap * 0.15;
    const lapTime = base + variation + tireDeg;
    const s1Frac = 0.30 + (rng() - 0.5) * 0.02;
    const s2Frac = 0.36 + (rng() - 0.5) * 0.02;

    laps.push({
      lapNumber: lap,
      lapTime: +lapTime.toFixed(3),
      s1Time: +(lapTime * s1Frac).toFixed(3),
      s2Time: +(lapTime * s2Frac).toFixed(3),
      s3Time: +(lapTime * (1 - s1Frac - s2Frac)).toFixed(3),
      compound: compounds[lap - 1] || 'medium',
      tireAge: lap <= 2 ? lap : lap - 2,
      telemetry: generateTelemetry(driverId, lap, circuit),
    });
  }
  return laps;
}

export function generatePitStops(driverId: number): PitStop[] {
  const seed = driverId * 777;
  const rng = mulberry32(seed);
  const count = driverId % 3 === 0 ? 2 : 1;
  const stops: PitStop[] = [];

  for (let i = 0; i < count; i++) {
    stops.push({
      lap: 15 + i * 18 + Math.floor(rng() * 5),
      duration: +(2.0 + rng() * 0.9).toFixed(1),
      compoundIn: i === 0 ? 'soft' : 'medium',
      compoundOut: i === 0 ? 'medium' : 'hard',
    });
  }
  return stops;
}

export function generateRadioMessages(driverId: number): RadioMessage[] {
  const seed = driverId * 333;
  const rng = mulberry32(seed);
  const templates: Omit<RadioMessage, 'lap' | 'timestamp'>[] = [
    { from: 'Engineer', type: 'strategy', message: 'Box this lap, box this lap.' },
    { from: 'Engineer', type: 'strategy', message: "We're going to Plan B, Plan B." },
    { from: 'Engineer', type: 'info', message: 'Gap to car ahead is 1.2 seconds and closing.' },
    { from: 'Engineer', type: 'info', message: 'Yellow flags in sector 2, be careful.' },
    { from: 'Driver', type: 'feedback', message: 'Copy, understood.' },
    { from: 'Driver', type: 'feedback', message: 'These tyres are gone, I have no grip!' },
    { from: 'Engineer', type: 'technical', message: "We're seeing high temps on the front left." },
    { from: 'Engineer', type: 'warning', message: "Track limits at turn 9, that's a warning." },
    { from: 'Engineer', type: 'warning', message: 'Car behind on fresher tyres, defend.' },
    { from: 'Engineer', type: 'celebration', message: 'Excellent overtake! Well done!' },
  ];

  const count = 4 + Math.floor(rng() * 4);
  const msgs: RadioMessage[] = [];
  for (let i = 0; i < count; i++) {
    const lap = 3 + Math.floor(i * (TOTAL_LAPS / count)) + Math.floor(rng() * 2);
    const t = templates[Math.floor(rng() * templates.length)];
    msgs.push({
      ...t,
      lap: Math.min(lap, TOTAL_LAPS),
      timestamp: `1:${(10 + lap).toString().padStart(2, '0')}:${Math.floor(rng() * 60).toString().padStart(2, '0')}`,
    });
  }
  return msgs.sort((a, b) => a.lap - b.lap);
}

export function generateIncidents(): Incident[] {
  const rng = mulberry32(42);
  const types = ['Collision', 'Track Limits', 'Unsafe Release', 'Speeding in Pit Lane', 'Impeding', 'Causing a Collision'];
  const outcomes = ['5 Second Penalty', '10 Second Penalty', 'Warning', 'No Further Action', 'Reprimand'];
  const count = 3 + Math.floor(rng() * 4);
  const incidents: Incident[] = [];

  for (let i = 0; i < count; i++) {
    const d1 = DRIVERS[Math.floor(rng() * DRIVERS.length)];
    const d2 = rng() > 0.4 ? DRIVERS[Math.floor(rng() * DRIVERS.length)] : null;
    const type = types[Math.floor(rng() * types.length)];
    const lap = 2 + Math.floor(rng() * (TOTAL_LAPS - 1));

    incidents.push({
      lap,
      type,
      driver1Id: d1.id,
      driver2Id: d2 && d2.id !== d1.id ? d2.id : null,
      outcome: outcomes[Math.floor(rng() * outcomes.length)],
      description: d2 && d2.id !== d1.id
        ? `${d1.abbrev} and ${d2.abbrev}: ${type} at Turn ${2 + Math.floor(rng() * 12)}`
        : `${d1.abbrev}: ${type} on Lap ${lap}`,
    });
  }
  return incidents.sort((a, b) => a.lap - b.lap);
}

export function generateLiveTiming(driverId: number, position: number, circuit: string): LiveTimingEntry {
  const seed = driverId * 999 + circuit.charCodeAt(0);
  const rng = mulberry32(seed);

  const sectorColor = (): SectorColor => {
    const p = rng();
    return p < 0.15 ? 'purple' : p < 0.45 ? 'green' : p < 0.75 ? 'yellow' : 'red';
  };

  const s1t = 26 + rng() * 2;
  const s2t = 28 + rng() * 2;
  const s3t = 27 + rng() * 2;
  const last = s1t + s2t + s3t;
  const compounds: TireCompound[] = ['soft', 'medium', 'hard'];

  return {
    position,
    driverId,
    gap: position === 1 ? 'LEADER' : `+${(position * (1.5 + rng() * 3)).toFixed(3)}`,
    interval: position === 1 ? '-' : `+${(0.2 + rng() * 2).toFixed(3)}`,
    lastLap: last.toFixed(3),
    bestLap: (last - 0.3 - rng() * 0.8).toFixed(3),
    s1: { time: s1t.toFixed(3), color: sectorColor() },
    s2: { time: s2t.toFixed(3), color: sectorColor() },
    s3: { time: s3t.toFixed(3), color: sectorColor() },
    compound: compounds[Math.floor(rng() * 3)],
    tireAge: 5 + Math.floor(rng() * 20),
  };
}

export function generateCarSetup(driverId: number): CarSetup {
  const seed = driverId * 555;
  const rng = mulberry32(seed);
  return {
    frontWing: 4 + Math.floor(rng() * 6),
    rearWing: 3 + Math.floor(rng() * 7),
    onThrottleDiff: 65 + Math.floor(rng() * 25),
    offThrottleDiff: 55 + Math.floor(rng() * 25),
    frontCamber: +(-3.5 + rng() * 1.5).toFixed(1),
    rearCamber: +(-2.0 + rng() * 1.0).toFixed(1),
    frontToe: +(0.05 + rng() * 0.1).toFixed(2),
    rearToe: +(0.15 + rng() * 0.15).toFixed(2),
    frontSuspension: 3 + Math.floor(rng() * 8),
    rearSuspension: 3 + Math.floor(rng() * 8),
    frontAntiRollBar: 4 + Math.floor(rng() * 7),
    rearAntiRollBar: 4 + Math.floor(rng() * 7),
    frontRideHeight: +(1.5 + rng() * 2).toFixed(1),
    rearRideHeight: +(5.0 + rng() * 3).toFixed(1),
    brakePressure: 90 + Math.floor(rng() * 10),
    brakeBias: 50 + Math.floor(rng() * 10),
  };
}
