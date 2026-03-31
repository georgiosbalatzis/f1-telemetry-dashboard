import { Activity, Gauge, Timer } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpenF1Driver } from '../../api/openf1';
import type { ComparisonPoint, DriverLapSummary, SectorRow, SpeedPoint } from './types';
import { ChartTip, NoData, Panel, Spinner } from './shared';
import { fmtLap } from './utils';

type Props = {
  lapNum: number;
  lapsLoading: boolean;
  sectorRows: SectorRow[];
  telemetryLoading: boolean;
  telemetryError: string | null;
  telemetryPoints: number;
  speedData: SpeedPoint[];
  comparisonSpeedData: ComparisonPoint[];
  lapTimeData: Array<Record<string, number | string>>;
  lapDeltaData: Array<Record<string, number | string>>;
  lapSummaries: DriverLapSummary[];
  driverNums: number[];
  driverMap: Record<number, OpenF1Driver>;
  driverColor: (driverNumber: number) => string;
};

export function TelemetryTab({
  lapNum,
  lapsLoading,
  sectorRows,
  telemetryLoading,
  telemetryError,
  telemetryPoints,
  speedData,
  comparisonSpeedData,
  lapTimeData,
  lapDeltaData,
  lapSummaries,
  driverNums,
  driverMap,
  driverColor,
}: Props) {
  return (
    <>
      {lapSummaries.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {lapSummaries.map((summary) => (
            <div key={summary.driverNumber} className="rounded-xl border border-white/5 bg-[#10101a]/90 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black tracking-[0.18em]" style={{ color: summary.color }}>{summary.name}</span>
                {summary.gapToLeader != null && summary.gapToLeader <= 0.0001 ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">Reference</span>
                ) : summary.gapToLeader != null ? (
                  <span className="text-[10px] font-mono text-gray-500">+{summary.gapToLeader.toFixed(3)}s</span>
                ) : null}
              </div>
              <div className="mb-3 text-2xl font-black font-mono text-white">{fmtLap(summary.lapTime)}</div>
              <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.14em] text-gray-500">
                <div>
                  <div className="mb-1 text-gray-600">Top</div>
                  <div className="text-sm font-bold text-gray-200">{summary.topSpeed?.toFixed(0) ?? '—'}</div>
                </div>
                <div>
                  <div className="mb-1 text-gray-600">Avg</div>
                  <div className="text-sm font-bold text-gray-200">{summary.avgSpeed?.toFixed(0) ?? '—'}</div>
                </div>
                <div>
                  <div className="mb-1 text-gray-600">Throttle</div>
                  <div className="text-sm font-bold text-gray-200">{summary.avgThrottle?.toFixed(0) ?? '—'}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Panel title="Sector Times" icon={<Timer size={14} className="text-purple-500" />} sub={`Lap ${lapNum} — ${sectorRows.some((row) => row.total) ? '' : 'waiting for data…'}`}>
        {sectorRows.some((row) => row.total) ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/[0.06]">
                <th className="py-2 text-left text-[10px] uppercase tracking-widest text-gray-600">Driver</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-gray-600">S1</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-gray-600">S2</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-gray-600">S3</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-gray-600">Lap</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-gray-600">I1 <span className="opacity-40">km/h</span></th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-gray-600">I2 <span className="opacity-40">km/h</span></th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-gray-600">ST <span className="opacity-40">km/h</span></th>
              </tr></thead>
              <tbody>{sectorRows.map((row) => (
                <tr key={row.name} className="border-b border-white/[0.03]">
                  <td className="py-2 text-xs font-bold" style={{ color: row.color }}>{row.name}</td>
                  <td className="py-2 text-right font-mono text-xs text-gray-300">{row.s1?.toFixed(3) ?? '—'}</td>
                  <td className="py-2 text-right font-mono text-xs text-gray-300">{row.s2?.toFixed(3) ?? '—'}</td>
                  <td className="py-2 text-right font-mono text-xs text-gray-300">{row.s3?.toFixed(3) ?? '—'}</td>
                  <td className="py-2 text-right text-xs font-bold font-mono text-white">{fmtLap(row.total ?? null)}</td>
                  <td className="py-2 text-right font-mono text-xs text-gray-500">{row.i1 ?? '—'}</td>
                  <td className="py-2 text-right font-mono text-xs text-gray-500">{row.i2 ?? '—'}</td>
                  <td className="py-2 text-right font-mono text-xs text-gray-500">{row.st ?? '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : lapsLoading ? <Spinner label="Loading lap data…" /> : <NoData msg="No sector times for this lap. Try a different lap number." />}
      </Panel>

      <Panel title="Speed Trace" icon={<Gauge size={14} className="text-red-500" />} sub={`${driverMap[driverNums[0]]?.full_name || 'Select a driver'} — Lap ${lapNum}${telemetryPoints ? ` (${telemetryPoints} data points)` : ''}`}>
        {telemetryLoading ? <Spinner label="Fetching car telemetry…" /> : telemetryError ? <NoData msg={telemetryError} /> : speedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="idx" tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
              <YAxis domain={[0, 370]} tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: '#444', fontSize: 10 }} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="speed" stroke={driverColor(driverNums[0])} strokeWidth={1.5} dot={false} name="Speed (km/h)" />
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData msg="No telemetry data. The API may not have car data for this session/lap. Try a race session." />}
      </Panel>

      <Panel title="Telemetry Comparison" icon={<Gauge size={14} className="text-cyan-400" />} sub={comparisonSpeedData.length > 0 ? `${driverNums.map((num) => driverMap[num]?.name_acronym).filter(Boolean).join(' vs ')} — normalized by lap progress` : 'Select at least two drivers with telemetry on this lap'}>
        {comparisonSpeedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={comparisonSpeedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="progress" tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" unit="%" />
              <YAxis domain={[0, 370]} tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: '#444', fontSize: 10 }} />
              <Tooltip content={<ChartTip />} />
              {driverNums.map((driverNumber) => (
                <Line key={driverNumber} type="monotone" dataKey={`speed_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={2} dot={false} connectNulls name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData msg="Normalized overlay becomes available when at least two selected drivers have telemetry for the chosen lap." />}
      </Panel>

      {speedData.length > 0 && (
        <Panel title="Throttle & Brake" icon={<Activity size={14} className="text-emerald-500" />}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="idx" tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
              <YAxis domain={[-110, 110]} tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" tickFormatter={(value: number) => `${Math.abs(value)}%`} />
              <ReferenceLine y={0} stroke="#ffffff15" strokeDasharray="4 4" />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="throttle" stroke="#22C55E" fill="#22C55E" fillOpacity={0.08} strokeWidth={1.5} name="Throttle %" />
              <Area type="monotone" dataKey="brake" stroke="#EF4444" fill="#EF4444" fillOpacity={0.08} strokeWidth={1.5} name="Brake" />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      )}

      <Panel title="Lap Times Comparison" icon={<Timer size={14} className="text-purple-500" />} sub={lapsLoading ? 'Loading lap data…' : `${driverNums.map((num) => driverMap[num]?.name_acronym).filter(Boolean).join(' vs ')} — excludes pit out-laps`}>
        {lapsLoading ? <Spinner /> : lapTimeData.some((point) => Object.keys(point).length > 1) ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={lapTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="lap" tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" interval={Math.max(0, Math.floor(lapTimeData.length / 15))} />
              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
              <Tooltip content={<ChartTip />} />
              {driverNums.map((driverNumber) => (
                <Line key={driverNumber} type="monotone" dataKey={`t_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={1.5} dot={{ r: 1.5 }} connectNulls name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData msg="No lap time data yet. Select drivers above." />}
      </Panel>

      <Panel title="Gap To Best Lap" icon={<Timer size={14} className="text-amber-400" />} sub="Per-lap delta to the fastest selected driver on that same lap">
        {lapsLoading ? <Spinner /> : lapDeltaData.some((point) => Object.keys(point).length > 1) ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lapDeltaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="lap" tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" interval={Math.max(0, Math.floor(lapDeltaData.length / 15))} />
              <YAxis tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" tickFormatter={(value: number) => `${value.toFixed(0)}ms`} />
              <Tooltip content={<ChartTip />} />
              {driverNums.map((driverNumber) => (
                <Line key={driverNumber} type="monotone" dataKey={`d_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={1.5} dot={false} connectNulls name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData msg="Gap trend needs comparable lap times from at least two selected drivers." />}
      </Panel>
    </>
  );
}
