import { Activity, Gauge, Timer, Trophy, Waves } from 'lucide-react';
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
  const leader = lapSummaries[0];
  const bestS1 = Math.min(...sectorRows.map((row) => row.s1 ?? Number.POSITIVE_INFINITY));
  const bestS2 = Math.min(...sectorRows.map((row) => row.s2 ?? Number.POSITIVE_INFINITY));
  const bestS3 = Math.min(...sectorRows.map((row) => row.s3 ?? Number.POSITIVE_INFINITY));

  return (
    <>
      {lapSummaries.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {lapSummaries.map((summary) => (
            <div key={summary.driverNumber} className="rounded-[18px] border border-white/[0.04] bg-[#10111a]/95 p-3 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.95)] sm:p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-xs font-black tracking-[0.22em]" style={{ color: summary.color }}>{summary.name}</span>
                {summary.gapToLeader != null && summary.gapToLeader <= 0.0001 ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">Reference</span>
                ) : summary.gapToLeader != null ? (
                  <span className="text-[10px] font-mono text-slate-500">+{summary.gapToLeader.toFixed(3)}s</span>
                ) : null}
              </div>
              <div className="mb-3 text-xl font-black font-mono text-white sm:text-2xl">{fmtLap(summary.lapTime)}</div>
              <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                <div>
                  <div className="mb-1 text-slate-700">Top</div>
                  <div className="text-sm font-bold text-slate-200">{summary.topSpeed?.toFixed(0) ?? '—'}</div>
                </div>
                <div>
                  <div className="mb-1 text-slate-700">Avg</div>
                  <div className="text-sm font-bold text-slate-200">{summary.avgSpeed?.toFixed(0) ?? '—'}</div>
                </div>
                <div>
                  <div className="mb-1 text-slate-700">Throttle</div>
                  <div className="text-sm font-bold text-slate-200">{summary.avgThrottle?.toFixed(0) ?? '—'}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr]">
        <div className="rounded-[18px] border border-white/[0.04] bg-[#11111b]/95 p-4 sm:col-span-2 xl:col-span-1">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-slate-500">
            <Trophy size={12} className="text-amber-300" />
            Race Reference
          </div>
          <div className="text-lg font-black uppercase tracking-[0.18em] text-white">{leader?.name || 'No leader'}</div>
          <div className="mt-1 text-2xl font-black font-mono text-violet-300">{fmtLap(leader?.lapTime ?? null)}</div>
        </div>
        <div className="rounded-[18px] border border-white/[0.04] bg-[#11111b]/95 p-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-slate-500">
            <Waves size={12} className="text-cyan-300" />
            Telemetry Density
          </div>
          <div className="text-lg font-black uppercase tracking-[0.18em] text-white">{telemetryPoints}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-600">points on focus lap</div>
        </div>
        <div className="rounded-[18px] border border-white/[0.04] bg-[#11111b]/95 p-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-slate-500">
            <Timer size={12} className="text-emerald-300" />
            Compare Mode
          </div>
          <div className="text-lg font-black uppercase tracking-[0.18em] text-white">{driverNums.length} drivers</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-600">normalized by lap progress</div>
        </div>
      </div>

      <Panel title="Sector Comparison" icon={<Activity size={14} className="text-cyan-400" />} sub="Share of lap time by sector for the selected lap">
        {sectorRows.some((row) => row.total) ? (
          <div className="space-y-4">
            {sectorRows.map((row) => {
              const total = (row.s1 || 0) + (row.s2 || 0) + (row.s3 || 0);
              const s1Width = total > 0 ? ((row.s1 || 0) / total) * 100 : 0;
              const s2Width = total > 0 ? ((row.s2 || 0) / total) * 100 : 0;
              const s3Width = total > 0 ? ((row.s3 || 0) / total) * 100 : 0;
              return (
                <div key={row.name} className="grid gap-2 md:grid-cols-[74px_1fr_88px] md:items-center md:gap-3">
                  <div className="flex items-center justify-between text-xs font-black tracking-[0.22em] md:block" style={{ color: row.color }}>
                    <span>{row.name}</span>
                    <span className="text-right text-sm font-black font-mono text-slate-200 md:hidden">{fmtLap(row.total ?? null)}</span>
                  </div>
                  <div className="overflow-hidden rounded-full bg-white/[0.04]">
                    <div className="flex h-6">
                      <div className="flex items-center justify-center bg-violet-500/80 text-[10px] font-bold text-white" style={{ width: `${s1Width}%` }}>{row.s1?.toFixed(3) ?? '—'}</div>
                      <div className="flex items-center justify-center bg-blue-500/75 text-[10px] font-bold text-white" style={{ width: `${s2Width}%` }}>{row.s2?.toFixed(3) ?? '—'}</div>
                      <div className="flex items-center justify-center bg-emerald-500/70 text-[10px] font-bold text-white" style={{ width: `${s3Width}%` }}>{row.s3?.toFixed(3) ?? '—'}</div>
                    </div>
                  </div>
                  <div className="hidden text-right text-sm font-black font-mono text-slate-200 md:block">{fmtLap(row.total ?? null)}</div>
                </div>
              );
            })}
          </div>
        ) : lapsLoading ? <Spinner label="Building sector split..." /> : <NoData msg="No sector comparison available for this lap." />}
      </Panel>

      <Panel title="Sector Times" icon={<Timer size={14} className="text-purple-500" />} sub={`Lap ${lapNum} — sector benchmark against selected drivers`}>
        {sectorRows.some((row) => row.total) ? (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="min-w-[560px] w-full text-sm">
              <thead><tr className="border-b border-white/[0.05]">
                <th className="py-2 text-left text-[10px] uppercase tracking-widest text-slate-600">Driver</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-slate-600">S1</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-slate-600">S2</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-slate-600">S3</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-slate-600">Lap</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-slate-600">Delta</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-slate-600">ST <span className="opacity-40">km/h</span></th>
              </tr></thead>
              <tbody>{sectorRows.map((row) => {
                const summary = lapSummaries.find((item) => item.name === row.name);
                return (
                  <tr key={row.name} className="border-b border-white/[0.03]">
                    <td className="py-2 text-xs font-bold" style={{ color: row.color }}>{row.name}</td>
                    <td className="py-2 text-right font-mono text-xs text-slate-300">
                      <span className={row.s1 != null && row.s1 <= bestS1 ? 'text-violet-300' : ''}>{row.s1?.toFixed(3) ?? '—'}</span>
                    </td>
                    <td className="py-2 text-right font-mono text-xs text-slate-300">
                      <span className={row.s2 != null && row.s2 <= bestS2 ? 'text-blue-300' : ''}>{row.s2?.toFixed(3) ?? '—'}</span>
                    </td>
                    <td className="py-2 text-right font-mono text-xs text-slate-300">
                      <span className={row.s3 != null && row.s3 <= bestS3 ? 'text-emerald-300' : ''}>{row.s3?.toFixed(3) ?? '—'}</span>
                    </td>
                    <td className="py-2 text-right text-xs font-bold font-mono text-white">{fmtLap(row.total ?? null)}</td>
                    <td className="py-2 text-right font-mono text-xs text-[#ff7d67]">{summary?.gapToLeader != null ? `+${summary.gapToLeader.toFixed(3)}` : '—'}</td>
                    <td className="py-2 text-right font-mono text-xs text-slate-500">{row.st ?? '—'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : lapsLoading ? <Spinner label="Loading lap data..." /> : <NoData msg="No sector times for this lap. Try a different lap number." />}
      </Panel>

      <Panel title="Speed Trace" icon={<Gauge size={14} className="text-red-500" />} sub={`${driverMap[driverNums[0]]?.full_name || 'Select a driver'} — Lap ${lapNum}${telemetryPoints ? ` (${telemetryPoints} points)` : ''}`} className="overflow-hidden">
        {telemetryLoading ? <Spinner label="Fetching car telemetry..." /> : telemetryError ? <NoData msg={telemetryError} /> : speedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="idx" tick={{ fill: '#586072', fontSize: 10 }} stroke="#ffffff06" />
              <YAxis domain={[0, 370]} tick={{ fill: '#586072', fontSize: 10 }} stroke="#ffffff06" label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: '#444d61', fontSize: 10 }} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="speed" stroke={driverColor(driverNums[0])} strokeWidth={1.8} dot={false} name="Speed (km/h)" />
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData msg="No telemetry data. The API may not have car data for this session/lap. Try a race session." />}
      </Panel>

      <Panel title="Telemetry Comparison" icon={<Gauge size={14} className="text-cyan-400" />} sub={comparisonSpeedData.length > 0 ? `${driverNums.map((num) => driverMap[num]?.name_acronym).filter(Boolean).join(' vs ')} — normalized by lap progress` : 'Select at least two drivers with telemetry on this lap'} className="overflow-hidden">
        {comparisonSpeedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={comparisonSpeedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="progress" tick={{ fill: '#586072', fontSize: 10 }} stroke="#ffffff06" unit="%" />
              <YAxis domain={[0, 370]} tick={{ fill: '#586072', fontSize: 10 }} stroke="#ffffff06" label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: '#444d61', fontSize: 10 }} />
              <Tooltip content={<ChartTip />} />
              {driverNums.map((driverNumber) => (
                <Line key={driverNumber} type="monotone" dataKey={`speed_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={2} dot={false} connectNulls name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData msg="Normalized overlay becomes available when at least two selected drivers have telemetry for the chosen lap." />}
      </Panel>

      {speedData.length > 0 && (
        <Panel title="Throttle & Brake" icon={<Activity size={14} className="text-emerald-500" />} className="overflow-hidden">
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="idx" tick={{ fill: '#586072', fontSize: 10 }} stroke="#ffffff06" />
              <YAxis domain={[-110, 110]} tick={{ fill: '#586072', fontSize: 10 }} stroke="#ffffff06" tickFormatter={(value: number) => `${Math.abs(value)}%`} />
              <ReferenceLine y={0} stroke="#ffffff15" strokeDasharray="4 4" />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="throttle" stroke="#22C55E" fill="#22C55E" fillOpacity={0.08} strokeWidth={1.5} name="Throttle %" />
              <Area type="monotone" dataKey="brake" stroke="#EF4444" fill="#EF4444" fillOpacity={0.08} strokeWidth={1.5} name="Brake" />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      )}

      <Panel title="Lap Times Comparison" icon={<Timer size={14} className="text-purple-500" />} sub={lapsLoading ? 'Loading lap data...' : `${driverNums.map((num) => driverMap[num]?.name_acronym).filter(Boolean).join(' vs ')} — excludes pit out-laps`} className="overflow-hidden">
        {lapsLoading ? <Spinner /> : lapTimeData.some((point) => Object.keys(point).length > 1) ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={lapTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="lap" tick={{ fill: '#586072', fontSize: 10 }} stroke="#ffffff06" interval={Math.max(0, Math.floor(lapTimeData.length / 15))} />
              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fill: '#586072', fontSize: 10 }} stroke="#ffffff06" />
              <Tooltip content={<ChartTip />} />
              {driverNums.map((driverNumber) => (
                <Line key={driverNumber} type="monotone" dataKey={`t_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={1.5} dot={{ r: 1.5 }} connectNulls name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData msg="No lap time data yet. Select drivers above." />}
      </Panel>

      <Panel title="Gap To Best Lap" icon={<Timer size={14} className="text-amber-400" />} sub="Per-lap delta to the fastest selected driver on that same lap" className="overflow-hidden">
        {lapsLoading ? <Spinner /> : lapDeltaData.some((point) => Object.keys(point).length > 1) ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lapDeltaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="lap" tick={{ fill: '#586072', fontSize: 10 }} stroke="#ffffff06" interval={Math.max(0, Math.floor(lapDeltaData.length / 15))} />
              <YAxis tick={{ fill: '#586072', fontSize: 10 }} stroke="#ffffff06" tickFormatter={(value: number) => `${value.toFixed(0)}ms`} />
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
