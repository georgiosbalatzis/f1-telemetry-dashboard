import { useMemo } from 'react';
import { Activity, Gauge, Timer, Trophy, Waves } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpenF1Driver } from '../../api/openf1';
import type { ComparisonPoint, DriverLapSummary, SectorRow, SpeedPoint } from './types';
import { ChartTip, EmbedPanelButton, Err, NoData, Panel, Spinner } from './shared';
import { ChartPanel, type ChartLegendItem } from './ChartPanel';
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
  comparisonControlData: ComparisonPoint[];
  lapTimeData: Array<Record<string, number | string>>;
  lapDeltaData: Array<Record<string, number | string>>;
  lapSummaries: DriverLapSummary[];
  driverNums: number[];
  driverMap: Record<number, OpenF1Driver>;
  driverColor: (driverNumber: number) => string;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
  onTelemetryRetry?: () => void;
};

function getBestSector(rows: SectorRow[], key: 's1' | 's2' | 's3') {
  const values = rows
    .map((row) => row[key])
    .filter((value): value is number => value != null);
  return values.length > 0 ? Math.min(...values) : null;
}

export function TelemetryTab({
  lapNum,
  lapsLoading,
  sectorRows,
  telemetryLoading,
  telemetryError,
  telemetryPoints,
  speedData,
  comparisonSpeedData,
  comparisonControlData,
  lapTimeData,
  lapDeltaData,
  lapSummaries,
  driverNums,
  driverMap,
  driverColor,
  embedMode = false,
  onEmbedPanel,
  onTelemetryRetry,
}: Props) {
  const leader = lapSummaries[0];
  const bestS1 = getBestSector(sectorRows, 's1');
  const bestS2 = getBestSector(sectorRows, 's2');
  const bestS3 = getBestSector(sectorRows, 's3');
  const chartGrid = 'var(--chart-grid)';
  const chartAxis = 'var(--chart-axis)';
  const chartAxisSoft = 'var(--chart-axis-soft)';
  const chartReference = 'var(--chart-reference)';
  const driverLegend = useMemo<ChartLegendItem[]>(
    () => driverNums.map((driverNumber) => ({
      label: driverMap[driverNumber]?.name_acronym || `#${driverNumber}`,
      color: driverColor(driverNumber),
    })),
    [driverColor, driverMap, driverNums],
  );
  const speedTraceLegend = comparisonSpeedData.length > 0
    ? driverLegend
    : driverNums[0] != null
      ? [{ label: driverMap[driverNums[0]]?.name_acronym || `#${driverNums[0]}`, color: driverColor(driverNums[0]) }]
      : [];
  const controlLegend: ChartLegendItem[] = comparisonControlData.length > 0
    ? driverNums.flatMap<ChartLegendItem>((driverNumber) => {
      const label = driverMap[driverNumber]?.name_acronym || `#${driverNumber}`;
      const color = driverColor(driverNumber);
      return [
        { label: `${label} Throttle`, color },
        { label: `${label} Brake`, color, dashed: true },
      ];
    })
    : [
      { label: 'Throttle', color: '#22C55E', variant: 'area' as const },
      { label: 'Brake', color: '#EF4444', variant: 'area' as const },
    ];
  const speedDeltaData = useMemo(() => {
    if (comparisonSpeedData.length === 0) return [];
    return comparisonSpeedData.map((point) => {
      const values = driverNums
        .map((driverNumber) => point[`speed_${driverNumber}`])
        .filter((value): value is number => typeof value === 'number');
      const bestValue = values.length > 0 ? Math.max(...values) : null;
      const deltaPoint: Record<string, number> & { progress: number } = { progress: point.progress };
      driverNums.forEach((driverNumber) => {
        const value = point[`speed_${driverNumber}`];
        if (bestValue != null && typeof value === 'number') {
          deltaPoint[`delta_${driverNumber}`] = bestValue - value;
        }
      });
      return deltaPoint;
    });
  }, [comparisonSpeedData, driverNums]);

  return (
    <>
      {lapSummaries.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {lapSummaries.map((summary) => (
            <div key={summary.driverNumber} className="dashboard-card rounded-[18px] p-3 sm:p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-xs font-black tracking-[0.22em]" style={{ color: summary.color }}>{summary.name}</span>
                {summary.gapToLeader != null && summary.gapToLeader <= 0.0001 ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-300">Reference</span>
                ) : summary.gapToLeader != null ? (
                  <span className="text-[10px] font-mono text-[color:var(--text-muted)]">+{summary.gapToLeader.toFixed(3)}s</span>
                ) : null}
              </div>
              <div className="mb-3 text-xl font-black font-mono text-[color:var(--text-strong)] sm:text-2xl">{fmtLap(summary.lapTime)}</div>
              <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                <div>
                  <div className="mb-1 text-[color:var(--text-dim)]">Top</div>
                  <div className="text-sm font-bold text-[color:var(--text-soft)]">{summary.topSpeed?.toFixed(0) ?? '—'}</div>
                </div>
                <div>
                  <div className="mb-1 text-[color:var(--text-dim)]">Avg</div>
                  <div className="text-sm font-bold text-[color:var(--text-soft)]">{summary.avgSpeed?.toFixed(0) ?? '—'}</div>
                </div>
                <div>
                  <div className="mb-1 text-[color:var(--text-dim)]">Throttle</div>
                  <div className="text-sm font-bold text-[color:var(--text-soft)]">{summary.avgThrottle?.toFixed(0) ?? '—'}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr]">
        <div className="dashboard-card rounded-[18px] p-4 sm:col-span-2 xl:col-span-1">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[color:var(--text-muted)]">
            <Trophy size={12} style={{ color: 'var(--accent)' }} />
            Race Reference
          </div>
          <div className="text-lg font-black uppercase tracking-[0.18em] text-[color:var(--text-strong)]">{leader?.name || 'No leader'}</div>
          <div className="mt-1 text-2xl font-black font-mono text-[color:var(--accent)]">{fmtLap(leader?.lapTime ?? null)}</div>
        </div>
        <div className="dashboard-card rounded-[18px] p-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[color:var(--text-muted)]">
            <Waves size={12} style={{ color: 'var(--accent-strong)' }} />
            Telemetry Density
          </div>
          <div className="text-lg font-black uppercase tracking-[0.18em] text-[color:var(--text-strong)]">{telemetryPoints}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">points on focus lap</div>
        </div>
        <div className="dashboard-card rounded-[18px] p-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[color:var(--text-muted)]">
            <Timer size={12} className="text-emerald-300" />
            Compare Mode
          </div>
          <div className="text-lg font-black uppercase tracking-[0.18em] text-[color:var(--text-strong)]">{driverNums.length} drivers</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">normalized by lap progress</div>
        </div>
      </div>

      <Panel
        title="Sector Comparison"
        icon={<Activity size={14} style={{ color: 'var(--accent)' }} />}
        sub="Share of lap time by sector for the selected lap"
        panelId="telemetry-sector-comparison"
        headerRight={embedMode && onEmbedPanel ? <EmbedPanelButton onClick={() => onEmbedPanel('telemetry-sector-comparison')} /> : undefined}
      >
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
                    <span className="text-right text-sm font-black font-mono text-[color:var(--text-soft)] md:hidden">{fmtLap(row.total ?? null)}</span>
                  </div>
                  <div className="overflow-hidden rounded-full bg-[color:var(--surface-track)]">
                    <div className="flex h-6">
                      <div className="flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${s1Width}%`, backgroundColor: 'var(--accent)' }}>{row.s1?.toFixed(3) ?? '—'}</div>
                      <div className="flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${s2Width}%`, backgroundColor: 'var(--accent-strong)' }}>{row.s2?.toFixed(3) ?? '—'}</div>
                      <div className="flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${s3Width}%`, backgroundColor: '#1AA34A' }}>{row.s3?.toFixed(3) ?? '—'}</div>
                    </div>
                  </div>
                  <div className="hidden text-right text-sm font-black font-mono text-[color:var(--text-soft)] md:block">{fmtLap(row.total ?? null)}</div>
                </div>
              );
            })}
          </div>
        ) : lapsLoading ? <Spinner label="Building sector split..." /> : <NoData msg="No sector comparison available for this lap." />}
      </Panel>

      <Panel title="Sector Times" icon={<Timer size={14} style={{ color: 'var(--accent-strong)' }} />} sub={`Lap ${lapNum} — sector benchmark against selected drivers`}>
        {sectorRows.some((row) => row.total) ? (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="min-w-[560px] w-full text-sm">
              <thead><tr className="border-b border-[color:var(--line)]">
                <th className="py-2 text-left text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">Driver</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">S1</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">S2</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">S3</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">Lap</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">Delta</th>
                <th className="py-2 text-right text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">ST <span className="opacity-40">km/h</span></th>
              </tr></thead>
              <tbody>{sectorRows.map((row) => {
                const summary = lapSummaries.find((item) => item.name === row.name);
                return (
                  <tr key={row.name} className="border-b border-[color:var(--line)]">
                    <td className="py-2 text-xs font-bold" style={{ color: row.color }}>{row.name}</td>
                    <td className="py-2 text-right font-mono text-xs text-[color:var(--text-soft)]">
                      <span style={bestS1 != null && row.s1 != null && row.s1 <= bestS1 ? { color: 'var(--accent)' } : undefined}>{row.s1?.toFixed(3) ?? '—'}</span>
                    </td>
                    <td className="py-2 text-right font-mono text-xs text-[color:var(--text-soft)]">
                      <span style={bestS2 != null && row.s2 != null && row.s2 <= bestS2 ? { color: 'var(--accent-strong)' } : undefined}>{row.s2?.toFixed(3) ?? '—'}</span>
                    </td>
                    <td className="py-2 text-right font-mono text-xs text-[color:var(--text-soft)]">
                      <span style={bestS3 != null && row.s3 != null && row.s3 <= bestS3 ? { color: '#1AA34A' } : undefined}>{row.s3?.toFixed(3) ?? '—'}</span>
                    </td>
                    <td className="py-2 text-right text-xs font-bold font-mono text-[color:var(--text-strong)]">{fmtLap(row.total ?? null)}</td>
                    <td className="py-2 text-right font-mono text-xs text-[color:var(--accent-strong)]">{summary?.gapToLeader != null ? `+${summary.gapToLeader.toFixed(3)}` : '—'}</td>
                    <td className="py-2 text-right font-mono text-xs text-[color:var(--text-muted)]">{row.st ?? '—'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : lapsLoading ? <Spinner label="Loading lap data..." /> : <NoData msg="No sector times for this lap. Try a different lap number." />}
      </Panel>

      <ChartPanel
        title="Speed Trace"
        icon={<Gauge size={14} style={{ color: 'var(--accent)' }} />}
        sub={comparisonSpeedData.length > 0
          ? `${driverNums.map((num) => driverMap[num]?.name_acronym).filter(Boolean).join(' vs ')} — normalized by lap progress`
          : `${driverMap[driverNums[0]]?.full_name || 'Select a driver'} — Lap ${lapNum}${telemetryPoints ? ` (${telemetryPoints} points)` : ''}`}
        className="overflow-hidden"
        exportName={`speed-trace-lap-${lapNum}`}
        legend={speedTraceLegend}
        panelId="telemetry-speed-trace"
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      >
        {telemetryLoading ? <Spinner label="Fetching car telemetry..." /> : telemetryError ? <Err msg={telemetryError} onAction={onTelemetryRetry} /> : comparisonSpeedData.length > 0 ? (
          <div className="h-[200px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonSpeedData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="progress" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} unit="%" />
                <YAxis domain={[0, 370]} tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: chartAxisSoft, fontSize: 10 }} />
                <Tooltip content={<ChartTip />} />
                {driverNums.map((driverNumber) => (
                  <Line key={driverNumber} type="monotone" dataKey={`speed_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : speedData.length > 0 ? (
          <div className="h-[200px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="idx" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
                <YAxis domain={[0, 370]} tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: chartAxisSoft, fontSize: 10 }} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="speed" stroke={driverColor(driverNums[0])} strokeWidth={1.8} dot={false} isAnimationActive={false} name="Speed (km/h)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="No telemetry data. The API may not have car data for this session/lap. Try a race session." />}
      </ChartPanel>

      <ChartPanel
        title="Speed Delta"
        icon={<Gauge size={14} style={{ color: 'var(--accent)' }} />}
        sub={comparisonSpeedData.length > 0 ? 'Per-sample delta to the fastest selected driver at the same point of the lap' : 'Select at least two drivers with telemetry on this lap'}
        className="overflow-hidden"
        exportName={`speed-delta-lap-${lapNum}`}
        legend={driverLegend}
        panelId="telemetry-speed-delta"
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      >
        {comparisonSpeedData.length > 0 ? (
          <div className="h-[160px] sm:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedDeltaData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="progress" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} unit="%" />
                <YAxis tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} tickFormatter={(value: number) => `${value.toFixed(0)} km/h`} />
                <Tooltip content={<ChartTip />} />
                {driverNums.map((driverNumber) => (
                  <Line key={driverNumber} type="monotone" dataKey={`delta_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="Speed delta becomes available when at least two selected drivers have telemetry for the chosen lap." />}
      </ChartPanel>

      {(speedData.length > 0 || comparisonControlData.length > 0) && (
        <ChartPanel
          title="Throttle & Brake"
          icon={<Activity size={14} style={{ color: 'var(--accent-strong)' }} />}
          className="overflow-hidden"
          exportName={`throttle-brake-lap-${lapNum}`}
          legend={controlLegend}
          panelId="telemetry-throttle-brake"
          embedMode={embedMode}
          onEmbedPanel={onEmbedPanel}
        >
          {comparisonControlData.length > 0 ? (
            <div className="h-[160px] sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonControlData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="progress" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} unit="%" />
                  <YAxis domain={[-110, 110]} tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} tickFormatter={(value: number) => `${Math.abs(value)}%`} />
                  <ReferenceLine y={0} stroke={chartReference} strokeDasharray="4 4" />
                  <Tooltip content={<ChartTip />} />
                  {driverNums.map((driverNumber) => (
                    <Line key={`throttle-${driverNumber}`} type="monotone" dataKey={`throttle_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} name={`${driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} Throttle`} />
                  ))}
                  {driverNums.map((driverNumber) => (
                    <Line key={`brake-${driverNumber}`} type="monotone" dataKey={`brake_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={1.6} strokeDasharray="6 5" dot={false} connectNulls isAnimationActive={false} name={`${driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} Brake`} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[140px] sm:h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={speedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="idx" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
                  <YAxis domain={[-110, 110]} tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} tickFormatter={(value: number) => `${Math.abs(value)}%`} />
                  <ReferenceLine y={0} stroke={chartReference} strokeDasharray="4 4" />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="throttle" stroke="#22C55E" fill="#22C55E" fillOpacity={0.08} strokeWidth={1.5} isAnimationActive={false} name="Throttle %" />
                  <Area type="monotone" dataKey="brake" stroke="#EF4444" fill="#EF4444" fillOpacity={0.08} strokeWidth={1.5} isAnimationActive={false} name="Brake" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartPanel>
      )}

      <ChartPanel title="Lap Times Comparison" icon={<Timer size={14} style={{ color: 'var(--accent-strong)' }} />} sub={lapsLoading ? 'Loading lap data...' : `${driverNums.map((num) => driverMap[num]?.name_acronym).filter(Boolean).join(' vs ')} — excludes pit out-laps`} className="overflow-hidden" exportName="lap-times-comparison" legend={driverLegend} panelId="telemetry-lap-times" embedMode={embedMode} onEmbedPanel={onEmbedPanel}>
        {lapsLoading ? <Spinner /> : lapTimeData.some((point) => Object.keys(point).length > 1) ? (
          <div className="h-[180px] sm:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lapTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="lap" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} interval={Math.max(0, Math.floor(lapTimeData.length / 15))} />
                <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
                <Tooltip content={<ChartTip />} />
                {driverNums.map((driverNumber) => (
                  <Line key={driverNumber} type="monotone" dataKey={`t_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="No lap time data yet. Select drivers above." />}
      </ChartPanel>

      <ChartPanel title="Gap To Best Lap" icon={<Timer size={14} style={{ color: 'var(--accent)' }} />} sub="Per-lap delta to the fastest selected driver on that same lap" className="overflow-hidden" exportName="gap-to-best-lap" legend={driverLegend} panelId="telemetry-gap-best" embedMode={embedMode} onEmbedPanel={onEmbedPanel}>
        {lapsLoading ? <Spinner /> : lapDeltaData.some((point) => Object.keys(point).length > 1) ? (
          <div className="h-[160px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lapDeltaData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="lap" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} interval={Math.max(0, Math.floor(lapDeltaData.length / 15))} />
                <YAxis tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} tickFormatter={(value: number) => `${value.toFixed(0)}ms`} />
                <Tooltip content={<ChartTip />} />
                {driverNums.map((driverNumber) => (
                  <Line key={driverNumber} type="monotone" dataKey={`d_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="Gap trend needs comparable lap times from at least two selected drivers." />}
      </ChartPanel>
    </>
  );
}
