import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ComposedChart,
  ReferenceLine
} from 'recharts';
import {
  Sun, Flag, Zap, Activity, Headphones, AlertTriangle, ChevronDown,
  Gauge, Timer, CircleDot, Loader2, Radio
} from 'lucide-react';
import {
  useMeetings, useSessions, useDrivers, useLaps, useLapTelemetry,
  useStints, usePits, useWeather, useRaceControl, useTeamRadio
} from '../hooks/useOpenF1';
import type { OpenF1Driver, OpenF1Lap, OpenF1Stint } from '../api/openf1';

// ─── Types & Constants ───────────────────────────────────────────────────────

type Tab = 'telemetry' | 'tires' | 'energy' | 'radio' | 'incidents' | 'weather';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'telemetry', label: 'Telemetry', icon: <Activity size={14} /> },
  { key: 'tires', label: 'Tyres & Strategy', icon: <CircleDot size={14} /> },
  { key: 'energy', label: 'DRS & Gears', icon: <Zap size={14} /> },
  { key: 'radio', label: 'Team Radio', icon: <Radio size={14} /> },
  { key: 'incidents', label: 'Race Control', icon: <Flag size={14} /> },
  { key: 'weather', label: 'Weather', icon: <Sun size={14} /> },
];

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#FF3333', MEDIUM: '#FFC300', HARD: '#EEEEEE',
  INTERMEDIATE: '#43B02A', WET: '#0067AD', UNKNOWN: '#888',
  HYPERSOFT: '#FF69B4', ULTRASOFT: '#C800FF', SUPERSOFT: '#FF3333',
  TEST_UNKNOWN: '#888',
};

function cn(...c: (string | false | undefined | null)[]) { return c.filter(Boolean).join(' '); }

// ─── Small UI Components ─────────────────────────────────────────────────────

function Spinner({ label }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin" />{label || 'Loading…'}</div>;
}
function Err({ msg }: { msg: string }) {
  return <div className="text-center py-10 text-red-400/80 text-sm"><AlertTriangle size={18} className="mx-auto mb-2 opacity-60" />{msg}</div>;
}
function NoData({ msg }: { msg: string }) {
  return <div className="text-center py-10 text-gray-600 text-sm">{msg}</div>;
}
function Stat({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="bg-[#1a1a2e]/80 border border-white/5 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-mono font-bold" style={{ color: color || '#E0E0E0' }}>{value}</span>
        {unit && <span className="text-[10px] text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}
function Panel({ title, icon, children, sub }: { title: string; icon?: React.ReactNode; children: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-[#12121f]/80 border border-white/[0.04] rounded-xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-1 flex items-center gap-2">{icon}{title}</h3>
      {sub && <p className="text-[10px] text-gray-600 mb-4">{sub}</p>}
      {!sub && <div className="mb-4" />}
      {children}
    </div>
  );
}

function DriverChip({ d, on, onClick }: { d: OpenF1Driver; on: boolean; onClick: () => void }) {
  const c = `#${d.team_colour || '888'}`;
  return (
    <button onClick={onClick}
      className={cn('flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all',
        on ? 'shadow-lg shadow-current/20' : 'border-white/10 text-gray-500 hover:text-gray-300')}
      style={on ? { color: c, borderColor: c, background: `${c}10` } : {}}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: on ? c : '#555' }} />
      {d.name_acronym} <span className="text-[10px] font-normal opacity-60">#{d.driver_number}</span>
    </button>
  );
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0d1a]/95 border border-white/10 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-xl text-xs">
      <div className="text-gray-500 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="font-mono font-bold" style={{ color: p.color }}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

function fmtLap(s: number | null): string {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const r = (s % 60).toFixed(3);
  return m > 0 ? `${m}:${r.padStart(6, '0')}` : `${r}s`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function F1TelemetryDashboard() {
  // Selection state
  const [year, setYear] = useState(new Date().getFullYear());
  const [circuit, setCircuit] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [driverNums, setDriverNums] = useState<number[]>([]);
  const [lapNum, setLapNum] = useState(1);
  const [tab, setTab] = useState<Tab>('telemetry');

  // ── Fetches (cascading: year → meetings → circuit → sessions → session → drivers → laps → telemetry)

  const meetings = useMeetings(year);
  const sessions = useSessions(year, circuit);
  const drivers = useDrivers(sessionKey);

  // Lap data for up to 4 selected drivers (hooks are safe with undefined)
  const laps0 = useLaps(sessionKey, driverNums[0]);
  const laps1 = useLaps(sessionKey, driverNums[1]);
  const laps2 = useLaps(sessionKey, driverNums[2]);
  const laps3 = useLaps(sessionKey, driverNums[3]);

  const stints = useStints(sessionKey);
  const pits = usePits(sessionKey);
  const weather = useWeather(sessionKey);
  const raceControl = useRaceControl(sessionKey);
  const teamRadio = useTeamRadio(sessionKey);

  // ── Derived: circuit dropdown options

  const circuitOpts = useMemo(() => {
    if (!meetings.data?.length) return [];
    const seen = new Set<string>();
    return meetings.data
      .filter(m => { if (seen.has(m.circuit_short_name)) return false; seen.add(m.circuit_short_name); return true; })
      .map(m => ({ v: m.circuit_short_name, l: `${m.circuit_short_name} — ${m.country_name}` }));
  }, [meetings.data]);

  // ── Derived: session dropdown options

  const sessionOpts = useMemo(() => {
    if (!sessions.data?.length) return [];
    return sessions.data.map(s => ({ v: s.session_key, l: s.session_name }));
  }, [sessions.data]);

  // ── Derived: driver list

  const driverList = useMemo(() => drivers.data || [], [drivers.data]);
  const driverMap = useMemo(() => {
    const m: Record<number, OpenF1Driver> = {};
    driverList.forEach(d => { m[d.driver_number] = d; });
    return m;
  }, [driverList]);

  // ── Derived: all laps per driver

  const allLaps = useMemo(() => {
    const m: Record<number, OpenF1Lap[]> = {};
    const srcs = [laps0, laps1, laps2, laps3];
    driverNums.forEach((num, i) => {
      const data = srcs[i]?.data;
      if (data?.length) m[num] = data;
    });
    return m;
  }, [driverNums, laps0.data, laps1.data, laps2.data, laps3.data]);

  const lapOpts = useMemo(() => {
    const s = new Set<number>();
    Object.values(allLaps).forEach(arr => arr.forEach(l => s.add(l.lap_number)));
    return Array.from(s).sort((a, b) => a - b);
  }, [allLaps]);

  // ── AUTO-SELECT: cascade selections via useEffect (NOT in render body) ──

  // Auto-select first circuit when meetings load
  useEffect(() => {
    if (circuitOpts.length > 0 && !circuit) {
      setCircuit(circuitOpts[0].v);
    }
  }, [circuitOpts, circuit]);

  // Auto-select Race session (or last session)
  useEffect(() => {
    if (sessionOpts.length > 0 && !sessionKey) {
      const race = sessionOpts.find(s => s.l.toLowerCase().includes('race'));
      setSessionKey(race?.v || sessionOpts[sessionOpts.length - 1].v);
    }
  }, [sessionOpts, sessionKey]);

  // Auto-select first 2 drivers
  useEffect(() => {
    if (driverList.length > 0 && driverNums.length === 0) {
      setDriverNums(driverList.slice(0, 2).map(d => d.driver_number));
    }
  }, [driverList, driverNums.length]);

  // Auto-select first valid lap
  useEffect(() => {
    if (lapOpts.length > 0 && !lapOpts.includes(lapNum)) {
      // Try to pick lap 2 (first real lap, not out-lap) or first available
      setLapNum(lapOpts.includes(2) ? 2 : lapOpts[0]);
    }
  }, [lapOpts, lapNum]);

  // Reset downstream when year changes
  const handleYearChange = useCallback((y: number) => {
    setYear(y); setCircuit(null); setSessionKey(null); setDriverNums([]); setLapNum(1);
  }, []);
  const handleCircuitChange = useCallback((c: string) => {
    setCircuit(c); setSessionKey(null); setDriverNums([]); setLapNum(1);
  }, []);
  const handleSessionChange = useCallback((sk: number) => {
    setSessionKey(sk); setDriverNums([]); setLapNum(1);
  }, []);

  // ── Telemetry for driver 1 on selected lap

  const d1LapObj = useMemo(() => (allLaps[driverNums[0]] || []).find(l => l.lap_number === lapNum), [allLaps, driverNums, lapNum]);
  const d1NextObj = useMemo(() => (allLaps[driverNums[0]] || []).find(l => l.lap_number === lapNum + 1), [allLaps, driverNums, lapNum]);

  const telemetry = useLapTelemetry(
    sessionKey,
    driverNums[0],
    d1LapObj?.date_start || null,
    d1NextObj?.date_start || null,
  );

  // ── Chart data

  const speedData = useMemo(() => {
    if (!telemetry.data?.length) return [];
    const raw = telemetry.data;
    const step = Math.max(1, Math.floor(raw.length / 250));
    return raw.filter((_, i) => i % step === 0).map((p, i) => ({
      idx: i,
      speed: p.speed,
      throttle: p.throttle,
      brake: -(p.brake),  // 0 or -100 — negative axis
      gear: p.n_gear,
      drs: p.drs >= 10 ? 1 : 0,
      rpm: p.rpm,
    }));
  }, [telemetry.data]);

  const lapTimeData = useMemo(() => {
    return lapOpts.map(lap => {
      const pt: Record<string, number | string> = { lap: `L${lap}` };
      driverNums.forEach(num => {
        const l = allLaps[num]?.find(x => x.lap_number === lap);
        if (l?.lap_duration && l.lap_duration > 0 && !l.is_pit_out_lap) {
          pt[`t_${num}`] = l.lap_duration;
        }
      });
      return pt;
    });
  }, [allLaps, driverNums, lapOpts]);

  const sectorRows = useMemo(() => {
    return driverNums.map(num => {
      const lap = allLaps[num]?.find(l => l.lap_number === lapNum);
      const d = driverMap[num];
      return {
        name: d?.name_acronym || `#${num}`,
        color: `#${d?.team_colour || '888'}`,
        s1: lap?.duration_sector_1, s2: lap?.duration_sector_2, s3: lap?.duration_sector_3,
        total: lap?.lap_duration,
        i1: lap?.i1_speed, i2: lap?.i2_speed, st: lap?.st_speed,
      };
    });
  }, [allLaps, driverNums, lapNum, driverMap]);

  const stintsByDriver = useMemo(() => {
    const m: Record<number, OpenF1Stint[]> = {};
    (stints.data || []).forEach(s => (m[s.driver_number] ||= []).push(s));
    return m;
  }, [stints.data]);

  const latestWeather = useMemo(() => weather.data?.length ? weather.data[weather.data.length - 1] : null, [weather.data]);
  const weatherRadar = useMemo(() => latestWeather ? [
    { subject: 'Air °C', value: Math.min(100, (latestWeather.air_temperature / 40) * 100) },
    { subject: 'Track °C', value: Math.min(100, (latestWeather.track_temperature / 60) * 100) },
    { subject: 'Humidity', value: latestWeather.humidity },
    { subject: 'Wind', value: Math.min(100, (latestWeather.wind_speed / 15) * 100) },
    { subject: 'Rain', value: latestWeather.rainfall ? 100 : 0 },
  ] : [], [latestWeather]);

  const toggleDriver = useCallback((num: number) => {
    setDriverNums(prev => {
      if (prev.includes(num)) return prev.length > 1 ? prev.filter(d => d !== num) : prev;
      return prev.length >= 4 ? [...prev.slice(1), num] : [...prev, num];
    });
  }, []);

  const dc = (num: number) => `#${driverMap[num]?.team_colour || '888'}`;
  const anyLoading = meetings.loading || sessions.loading || drivers.loading;
  const lapsLoading = laps0.loading || laps1.loading || laps2.loading || laps3.loading;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a14] text-gray-200 selection:bg-red-600/30">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-red-600/[0.03] blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.02] blur-[100px]" />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <header className="pt-8 pb-6 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 bg-red-600 rounded-full" />
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white" style={{ fontFamily: "'Orbitron', system-ui" }}>F1 TELEMETRY</h1>
            </div>
            <p className="text-xs tracking-[0.25em] uppercase text-gray-600 ml-[19px]">Powered by OpenF1 — Real Race Data</p>
          </div>
          {anyLoading && <span className="flex items-center gap-2 text-[10px] text-amber-500 uppercase tracking-widest"><Loader2 size={12} className="animate-spin" /> Loading…</span>}
        </header>

        {/* Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {/* Year */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Season</label>
            <div className="relative">
              <select value={year} onChange={e => handleYearChange(+e.target.value)}
                className="w-full appearance-none bg-[#12121f] border border-white/[0.06] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50 cursor-pointer">
                {Array.from({ length: new Date().getFullYear() - 2022 }, (_, i) => 2023 + i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            </div>
          </div>
          {/* Circuit */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Grand Prix</label>
            <div className="relative">
              <select value={circuit || ''} onChange={e => handleCircuitChange(e.target.value)}
                className="w-full appearance-none bg-[#12121f] border border-white/[0.06] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50 cursor-pointer"
                disabled={!circuitOpts.length}>
                {meetings.loading && <option>Loading circuits…</option>}
                {!meetings.loading && circuitOpts.length === 0 && <option>No data for {year}</option>}
                {circuitOpts.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            </div>
          </div>
          {/* Session */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">Session</label>
            <div className="relative">
              <select value={sessionKey || ''} onChange={e => handleSessionChange(+e.target.value)}
                className="w-full appearance-none bg-[#12121f] border border-white/[0.06] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50 cursor-pointer"
                disabled={!sessionOpts.length}>
                {sessions.loading && <option>Loading sessions…</option>}
                {!sessions.loading && sessionOpts.length === 0 && <option>Select a GP first</option>}
                {sessionOpts.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            </div>
          </div>
          {/* Lap */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-1.5">
              Lap {lapsLoading && <Loader2 size={10} className="inline animate-spin ml-1" />}
            </label>
            <div className="relative">
              <select value={lapNum} onChange={e => setLapNum(+e.target.value)}
                className="w-full appearance-none bg-[#12121f] border border-white/[0.06] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50 cursor-pointer"
                disabled={!lapOpts.length}>
                {lapOpts.length === 0 && <option>Select drivers first</option>}
                {lapOpts.map(l => <option key={l} value={l}>Lap {l}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Error states for top-level fetches */}
        {meetings.error && <Err msg={`Failed to load calendar: ${meetings.error}`} />}
        {sessions.error && <Err msg={`Failed to load sessions: ${sessions.error}`} />}
        {drivers.error && <Err msg={`Failed to load drivers: ${drivers.error}`} />}

        {/* Drivers */}
        {driverList.length > 0 && (
          <div className="mb-6">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 mb-2">Drivers <span className="text-gray-700">(up to 4)</span></label>
            <div className="flex flex-wrap gap-2">
              {driverList.map(d => <DriverChip key={d.driver_number} d={d} on={driverNums.includes(d.driver_number)} onClick={() => toggleDriver(d.driver_number)} />)}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-white/[0.06]">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase whitespace-nowrap border-b-2 transition-all',
                  tab === t.key ? 'border-red-600 text-white' : 'border-transparent text-gray-600 hover:text-gray-400')}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="pb-16 space-y-6">

          {/* ─── TELEMETRY ─── */}
          {tab === 'telemetry' && <>
            {/* Sector times */}
            <Panel title="Sector Times" icon={<Timer size={14} className="text-purple-500" />} sub={`Lap ${lapNum} — ${sectorRows.some(r => r.total) ? '' : 'waiting for data…'}`}>
              {sectorRows.some(r => r.total) ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/[0.06]">
                      <th className="text-left text-[10px] uppercase tracking-widest text-gray-600 py-2">Driver</th>
                      <th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">S1</th>
                      <th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">S2</th>
                      <th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">S3</th>
                      <th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">Lap</th>
                      <th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">I1 <span className="opacity-40">km/h</span></th>
                      <th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">I2 <span className="opacity-40">km/h</span></th>
                      <th className="text-right text-[10px] uppercase tracking-widest text-gray-600 py-2">ST <span className="opacity-40">km/h</span></th>
                    </tr></thead>
                    <tbody>{sectorRows.map(r => (
                      <tr key={r.name} className="border-b border-white/[0.03]">
                        <td className="py-2 font-bold text-xs" style={{ color: r.color }}>{r.name}</td>
                        <td className="py-2 text-right font-mono text-xs text-gray-300">{r.s1?.toFixed(3) ?? '—'}</td>
                        <td className="py-2 text-right font-mono text-xs text-gray-300">{r.s2?.toFixed(3) ?? '—'}</td>
                        <td className="py-2 text-right font-mono text-xs text-gray-300">{r.s3?.toFixed(3) ?? '—'}</td>
                        <td className="py-2 text-right font-mono text-xs font-bold text-white">{fmtLap(r.total ?? null)}</td>
                        <td className="py-2 text-right font-mono text-xs text-gray-500">{r.i1 ?? '—'}</td>
                        <td className="py-2 text-right font-mono text-xs text-gray-500">{r.i2 ?? '—'}</td>
                        <td className="py-2 text-right font-mono text-xs text-gray-500">{r.st ?? '—'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : lapsLoading ? <Spinner label="Loading lap data…" /> : <NoData msg="No sector times for this lap. Try a different lap number." />}
            </Panel>

            {/* Speed trace */}
            <Panel title="Speed Trace" icon={<Gauge size={14} className="text-red-500" />}
              sub={`${driverMap[driverNums[0]]?.full_name || 'Select a driver'} — Lap ${lapNum}${telemetry.data ? ` (${telemetry.data.length} data points)` : ''}`}>
              {telemetry.loading ? <Spinner label="Fetching car telemetry…" /> :
               telemetry.error ? <Err msg={telemetry.error} /> :
               speedData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={speedData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                    <XAxis dataKey="idx" tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
                    <YAxis domain={[0, 370]} tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: '#444', fontSize: 10 }} />
                    <Tooltip content={<ChartTip />} />
                    <Line type="monotone" dataKey="speed" stroke={dc(driverNums[0])} strokeWidth={1.5} dot={false} name="Speed (km/h)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <NoData msg="No telemetry data. The API may not have car data for this session/lap. Try a race session." />}
            </Panel>

            {/* Throttle / Brake */}
            {speedData.length > 0 && (
              <Panel title="Throttle & Brake" icon={<Activity size={14} className="text-emerald-500" />}>
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={speedData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                    <XAxis dataKey="idx" tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
                    <YAxis domain={[-110, 110]} tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" tickFormatter={(v: number) => `${Math.abs(v)}%`} />
                    <ReferenceLine y={0} stroke="#ffffff15" strokeDasharray="4 4" />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="throttle" stroke="#22C55E" fill="#22C55E" fillOpacity={0.08} strokeWidth={1.5} name="Throttle %" />
                    <Area type="monotone" dataKey="brake" stroke="#EF4444" fill="#EF4444" fillOpacity={0.08} strokeWidth={1.5} name="Brake" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Panel>
            )}

            {/* Lap times */}
            <Panel title="Lap Times Comparison" icon={<Timer size={14} className="text-purple-500" />}
              sub={lapsLoading ? 'Loading lap data…' : `${driverNums.map(n => driverMap[n]?.name_acronym).filter(Boolean).join(' vs ')} — excludes pit out-laps`}>
              {lapsLoading ? <Spinner /> : lapTimeData.some(pt => Object.keys(pt).length > 1) ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={lapTimeData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                    <XAxis dataKey="lap" tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" interval={Math.max(0, Math.floor(lapTimeData.length / 15))} />
                    <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
                    <Tooltip content={<ChartTip />} />
                    {driverNums.map(num => (
                      <Line key={num} type="monotone" dataKey={`t_${num}`} stroke={dc(num)} strokeWidth={1.5} dot={{ r: 1.5 }} connectNulls name={driverMap[num]?.name_acronym || `#${num}`} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : <NoData msg="No lap time data yet. Select drivers above." />}
            </Panel>
          </>}

          {/* ─── TYRES ─── */}
          {tab === 'tires' && <>
            <Panel title="Tyre Strategy" icon={<CircleDot size={14} className="text-red-400" />}>
              {stints.loading ? <Spinner label="Loading stint data…" /> :
               Object.keys(stintsByDriver).length > 0 ? (
                <div className="space-y-3">
                  {(driverNums.length > 0 ? driverNums : Object.keys(stintsByDriver).map(Number).slice(0, 6)).map(num => {
                    const d = driverMap[num];
                    const ds = stintsByDriver[num];
                    if (!d || !ds?.length) return null;
                    const maxLap = Math.max(...ds.map(s => s.lap_end || 0), 1);
                    return (
                      <div key={num} className="flex items-center gap-4">
                        <div className="w-16 text-right"><span className="text-xs font-bold" style={{ color: `#${d.team_colour}` }}>{d.name_acronym}</span></div>
                        <div className="flex-1 h-8 bg-[#0d0d1a] rounded-md overflow-hidden flex">
                          {ds.map((stint, i) => {
                            const w = Math.max(3, ((stint.lap_end - stint.lap_start + 1) / maxLap) * 100);
                            const c = (stint.compound || 'UNKNOWN').toUpperCase();
                            const col = COMPOUND_COLORS[c] || COMPOUND_COLORS.UNKNOWN;
                            return (
                              <div key={i} className="h-full flex items-center justify-center text-[10px] font-bold border-r border-white/10 min-w-[24px]"
                                style={{ width: `${w}%`, backgroundColor: `${col}18`, color: col }}
                                title={`${c}: Lap ${stint.lap_start}–${stint.lap_end}`}>
                                {c.charAt(0)}
                                <span className="ml-1 opacity-40 hidden sm:inline">{stint.lap_start}-{stint.lap_end}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="w-14 text-right text-[10px] text-gray-600">{ds.length} stint{ds.length > 1 ? 's' : ''}</div>
                      </div>
                    );
                  })}
                </div>
              ) : <NoData msg="No stint data for this session. Stint data is typically available for race and sprint sessions." />}
            </Panel>

            <Panel title="Pit Stops" icon={<Timer size={14} className="text-amber-500" />}>
              {pits.loading ? <Spinner /> :
               pits.data && pits.data.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {pits.data
                    .filter(p => driverNums.length === 0 || driverNums.includes(p.driver_number))
                    .sort((a, b) => a.stop_duration - b.stop_duration)
                    .map((pit, i) => {
                      const d = driverMap[pit.driver_number];
                      return (
                        <div key={i} className="bg-[#0d0d1a] rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${d?.team_colour || '888'}` }} />
                            <span className="text-xs font-bold" style={{ color: `#${d?.team_colour || '888'}` }}>{d?.name_acronym || `#${pit.driver_number}`}</span>
                          </div>
                          <div className="text-xl font-mono font-black text-white">{pit.stop_duration?.toFixed(1) || '—'}<span className="text-sm text-gray-500">s</span></div>
                          <div className="text-[10px] text-gray-600">Lap {pit.lap_number} · Pit lane: {pit.pit_duration?.toFixed(1)}s</div>
                        </div>
                      );
                    })}
                </div>
              ) : <NoData msg="No pit stop data for this session." />}
            </Panel>
          </>}

          {/* ─── DRS & GEARS ─── */}
          {tab === 'energy' && <>
            <Panel title="DRS Activation" icon={<Zap size={14} className="text-cyan-400" />}
              sub={`${driverMap[driverNums[0]]?.name_acronym || '—'} — Lap ${lapNum} · DRS values ≥ 10 = active`}>
              {telemetry.loading ? <Spinner /> : speedData.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={speedData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                    <XAxis dataKey="idx" tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
                    <YAxis domain={[0, 1.2]} ticks={[0, 1]} tickFormatter={(v: number) => v >= 1 ? 'OPEN' : 'CLOSED'} tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
                    <Tooltip content={<ChartTip />} />
                    <Area type="stepAfter" dataKey="drs" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.15} strokeWidth={2} name="DRS" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <NoData msg="No car data for this lap. Try a race session lap." />}
            </Panel>

            <Panel title="Gear & RPM" icon={<Gauge size={14} className="text-amber-500" />}>
              {speedData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={speedData}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                    <XAxis dataKey="idx" tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
                    <YAxis yAxisId="gear" domain={[0, 9]} ticks={[1,2,3,4,5,6,7,8]} tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
                    <YAxis yAxisId="rpm" orientation="right" domain={[0, 15000]} tick={{ fill: '#333', fontSize: 9 }} stroke="#ffffff04" />
                    <Tooltip content={<ChartTip />} />
                    <Line yAxisId="gear" type="stepAfter" dataKey="gear" stroke="#F59E0B" strokeWidth={2} dot={false} name="Gear" />
                    <Line yAxisId="rpm" type="monotone" dataKey="rpm" stroke="#ffffff15" strokeWidth={0.8} dot={false} name="RPM" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <NoData msg="No data." />}
            </Panel>
          </>}

          {/* ─── TEAM RADIO ─── */}
          {tab === 'radio' && (
            <Panel title="Team Radio Recordings" icon={<Headphones size={14} className="text-cyan-400" />}
              sub="Click to listen to actual team radio recordings from the session">
              {teamRadio.loading ? <Spinner /> : teamRadio.error ? <Err msg={teamRadio.error} /> : (() => {
                const msgs = (teamRadio.data || []).filter(r => driverNums.length === 0 || driverNums.includes(r.driver_number));
                return msgs.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {msgs.map((r, i) => {
                      const d = driverMap[r.driver_number];
                      return (
                        <div key={i} className="flex gap-3 py-2 border-b border-white/[0.03] last:border-0">
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: `#${d?.team_colour || '888'}` }} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold" style={{ color: `#${d?.team_colour || '888'}` }}>{d?.name_acronym || `#${r.driver_number}`}</span>
                              <span className="text-[10px] text-gray-700 font-mono">{new Date(r.date).toLocaleTimeString()}</span>
                            </div>
                            <a href={r.recording_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 inline-flex items-center gap-1">
                              <Headphones size={10} /> Play recording ↗
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <NoData msg="No team radio recordings for this session/driver selection." />;
              })()}
            </Panel>
          )}

          {/* ─── RACE CONTROL ─── */}
          {tab === 'incidents' && (
            <Panel title="Race Control Messages" icon={<Flag size={14} className="text-yellow-500" />}
              sub="Official flags, penalties, safety car, and session status messages">
              {raceControl.loading ? <Spinner /> : raceControl.error ? <Err msg={raceControl.error} /> : (() => {
                const msgs = raceControl.data || [];
                return msgs.length > 0 ? (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                    {msgs.map((msg, i) => (
                      <div key={i} className="flex gap-4 py-2 border-b border-white/[0.03] last:border-0">
                        <div className="w-16 text-right shrink-0">
                          {msg.lap_number != null && <div className="text-[10px] text-gray-500">Lap {msg.lap_number}</div>}
                          <div className="text-[10px] text-gray-700 font-mono">{new Date(msg.date).toLocaleTimeString()}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {msg.flag && <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase',
                              msg.flag.includes('RED') && 'bg-red-500/15 text-red-400',
                              msg.flag.includes('YELLOW') && 'bg-yellow-500/15 text-yellow-400',
                              msg.flag.includes('GREEN') && 'bg-emerald-500/15 text-emerald-400',
                              msg.flag.includes('BLUE') && 'bg-blue-500/15 text-blue-400',
                              msg.flag === 'CHEQUERED' && 'bg-white/15 text-white',
                              !msg.flag.match(/RED|YELLOW|GREEN|BLUE|CHEQUERED/) && 'bg-gray-500/15 text-gray-400',
                            )}>{msg.flag}</span>}
                            <span className="text-[10px] text-gray-500 uppercase">{msg.category}</span>
                          </div>
                          <p className="text-xs text-gray-300">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <NoData msg="No race control messages for this session." />;
              })()}
            </Panel>
          )}

          {/* ─── WEATHER ─── */}
          {tab === 'weather' && <>
            {weather.loading ? <Spinner /> : weather.error ? <Err msg={weather.error} /> : latestWeather ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="Air Temperature" value={latestWeather.air_temperature.toFixed(1)} unit="°C" color="#EF4444" />
                  <Stat label="Track Temperature" value={latestWeather.track_temperature.toFixed(1)} unit="°C" color="#F97316" />
                  <Stat label="Humidity" value={latestWeather.humidity.toFixed(0)} unit="%" color="#3B82F6" />
                  <Stat label="Wind Speed" value={latestWeather.wind_speed.toFixed(1)} unit="m/s" color="#06B6D4" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="Pressure" value={latestWeather.pressure.toFixed(0)} unit="mbar" />
                  <Stat label="Rainfall" value={latestWeather.rainfall ? 'Yes' : 'No'} color={latestWeather.rainfall ? '#3B82F6' : '#22C55E'} />
                  <Stat label="Wind Direction" value={latestWeather.wind_direction.toFixed(0)} unit="°" />
                  <Stat label="Weather Samples" value={weather.data?.length || 0} />
                </div>
                <Panel title="Conditions Radar" icon={<Sun size={14} className="text-yellow-400" />}>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={weatherRadar} outerRadius="70%">
                      <PolarGrid stroke="#ffffff08" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10 }} />
                      <Radar name="Conditions" dataKey="value" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.12} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Panel>
              </>
            ) : <NoData msg="No weather data for this session." />}
          </>}

        </div>
      </div>
    </div>
  );
}
