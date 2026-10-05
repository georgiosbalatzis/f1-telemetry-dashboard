import { useMemo, memo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { teamColor } from '../../constants/colors';
import { ResponsiveTelemetryPlot } from '../../embeds/TelemetryPlot';
import { figureLegend, figurePlotData } from '../../embeds/plotModel';
import { copy } from '../../copy';
import { useDriverContext } from '../../contexts/useDriverContext';
import type { ComparisonPoint, DriverLapSummary, SectorRow, SpeedPoint } from './types';
import { PanelSelection, ChartSkeleton, ChartTip, EmbedPanelButton, Err, NoData, Panel, TableSkeleton } from './shared';
import { ChartPanel, type ChartLegendItem } from './ChartPanel';
import { fmtLap } from './utils';
import { GapCard } from './GapCard';
import { SummaryStrip } from './SummaryStrip';
import { useProgressAxis } from './useProgressAxis';
import { SECTOR_STYLE, buildSectorAnalysis } from './broadcast/broadcastUtils';
import type { GapCardData } from './gapCardData';
import { AXIS_TICK, AXIS_TICK_SOFT, CHART_MARGIN, evenTicks, formatLapAxis, useXTickCount } from './chartAxis';

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
  gapCards: GapCardData[];
  sessionTitle: string;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
  onTelemetryRetry?: () => void;
};

export const TelemetryTab = memo(function TelemetryTab({
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
  gapCards,
  sessionTitle,
  embedMode = false,
  onEmbedPanel,
  onTelemetryRetry,
}: Props) {
  const { driverNums, driverMap, driverColor, driverDash } = useDriverContext();
  // Purple = quickest of the selected drivers in that sector, green = second quickest.
  const { s1Classes, s2Classes, s3Classes } = useMemo(() => buildSectorAnalysis(sectorRows), [sectorRows]);
  const sectorClasses = [s1Classes, s2Classes, s3Classes];
  const chartGrid = 'var(--chart-grid)';
  const xTickCount = useXTickCount();
  const lapTicks = evenTicks(lapTimeData.map((point) => point.lap), xTickCount);
  const driverLegend = useMemo<ChartLegendItem[]>(
    () => driverNums.filter((driverNumber) => lapTimeData.some((point) => typeof point[`t_${driverNumber}`] === 'number')).map((driverNumber) => ({
      label: driverMap[driverNumber]?.name_acronym || `#${driverNumber}`,
      strokeDasharray: driverDash(driverNumber), color: driverColor(driverNumber),
    })),
    [driverColor, driverDash, driverMap, driverNums, lapTimeData],
  );
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

  const { axis: progressAxis, guides: cornerGuides, marks } = useProgressAxis(comparisonSpeedData, driverNums);
  const plotDrivers = driverNums.map((number) => ({
    number, fullName: driverMap[number]?.full_name || `#${number}`,
    acronym: driverMap[number]?.name_acronym || `#${number}`,
    teamColour: teamColor(driverMap[number]?.team_colour),
    lineDash: driverDash(number), brakeDash: driverDash(number, 'brake') ?? '6 4',
  }));
  const colours = Object.fromEntries(driverNums.map((number) => [number, driverColor(number)]));
  const speedPlot = figurePlotData('speed', plotDrivers, speedData, comparisonSpeedData, marks);
  const pedalPlot = figurePlotData('pedals', plotDrivers, speedData, comparisonControlData, marks);
  const speedTraceLegend = figureLegend(speedPlot, 'light', colours);
  const controlLegend = figureLegend(pedalPlot, 'light', colours);

  return (
    <PanelSelection embedMode={embedMode}>
      <ChartPanel lead
        title="Speed Trace"
        sub={comparisonSpeedData.length > 0
          ? `${speedTraceLegend.map((item) => item.label).join(' vs ')} — normalized by lap progress`
          : `${driverMap[driverNums[0]]?.full_name || 'Select a driver'} — Lap ${lapNum}${telemetryPoints ? ` (${telemetryPoints} points)` : ''}`}
        className="overflow-hidden"
        exportName={`speed-trace-lap-${lapNum}`}
        legend={speedTraceLegend}
        source={copy.chart.sourceCarData}
        panelId="telemetry-speed-trace"
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      >
        <SummaryStrip title={sessionTitle} subtitle={copy.scope.lapOption(lapNum)} summaries={lapSummaries} />
        {telemetryLoading ? <ChartSkeleton label="Fetching car telemetry..." className="h-[240px] sm:h-[380px]" /> : telemetryError ? <Err msg={telemetryError} onAction={onTelemetryRetry} /> : (comparisonSpeedData.length > 0 || speedData.length > 0) ? (
          <ResponsiveTelemetryPlot data={speedPlot} colours={colours} />
        ) : <NoData msg="No telemetry data. The API may not have car data for this session/lap. Try a race session." />}
      </ChartPanel>

      <div className="pair-row">
        {gapCards.length > 0 && <div className="gap-cards">{gapCards.map((card) => <GapCard key={card.driverNumber} card={card} context={`${sessionTitle} · L${lapNum}`} />)}</div>}
        <Panel title="Sector Times" sub={`Lap ${lapNum} — sector benchmark against selected drivers`}>
          {sectorRows.some((row) => row.total) ? (
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Sector times, scroll horizontally for all measurements">
              <table className="data-table">
                <thead><tr>
                  <th>Driver</th><th>S1</th><th>S2</th><th>S3</th><th>Lap</th><th>Delta</th><th>ST <span className="opacity-40">km/h</span></th>
                </tr></thead>
                <tbody>{sectorRows.map((row, index) => {
                  const summary = lapSummaries.find((item) => item.name === row.name);
                  return (
                    <tr key={row.name} style={{ ['--row-color' as string]: row.color }}>
                      <td>{row.name}</td>
                      {(['s1', 's2', 's3'] as const).map((key, column) => (
                        <td key={key} style={{ color: SECTOR_STYLE[sectorClasses[column][index]].text }}>{row[key]?.toFixed(3) ?? '—'}</td>
                      ))}
                      <td className="total">{fmtLap(row.total ?? null)}</td>
                      <td>{summary?.gapToLeader != null ? `+${summary.gapToLeader.toFixed(3)}` : '—'}</td>
                      <td className="muted">{row.st ?? '—'}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          ) : lapsLoading ? <TableSkeleton rows={6} label="Loading lap data..." /> : <NoData msg="No sector times for this lap. Try a different lap number." />}
        </Panel>
      </div>

      <ChartPanel
        title="Speed Delta"
        sub={comparisonSpeedData.length > 0 ? 'Per-sample delta to the fastest selected driver at the same point of the lap' : 'Select at least two drivers with telemetry on this lap'}
        className="overflow-hidden"
        exportName={`speed-delta-lap-${lapNum}`}
        legend={comparisonSpeedData.length > 0 ? speedTraceLegend : []}
        source={copy.chart.sourceCarData}
        panelId="telemetry-speed-delta"
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      >
        {comparisonSpeedData.length > 0 ? (
          <div className="h-[160px] sm:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedDeltaData} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="progress" {...progressAxis} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} stroke={chartGrid} label={{ value: 'km/h', angle: -90, position: 'insideLeft', ...AXIS_TICK_SOFT }} />
                {cornerGuides}
                <Tooltip content={<ChartTip unit="km/h" labelPrefix="Lap progress · " labelSuffix="%" />} />
                {driverNums.map((driverNumber) => (
                  <Line key={driverNumber} type="monotone" dataKey={`delta_${driverNumber}`} stroke={driverColor(driverNumber)} strokeDasharray={driverDash(driverNumber)} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="Speed delta becomes available when at least two selected drivers have telemetry for the chosen lap." />}
      </ChartPanel>

      {(speedData.length > 0 || comparisonControlData.length > 0) && (
        <ChartPanel
          title="Throttle & Brake"
          sub="Pedal application · throttle above the centre line, brake below"
          className="overflow-hidden"
          exportName={`throttle-brake-lap-${lapNum}`}
          legend={controlLegend}
          source={copy.chart.sourceCarData}
          panelId="telemetry-throttle-brake"
          embedMode={embedMode}
          onEmbedPanel={onEmbedPanel}
        >
          <ResponsiveTelemetryPlot data={pedalPlot} colours={colours} />
        </ChartPanel>
      )}

      <Panel
        title="Sector Comparison"
        sub="Share of lap time · S1 / S2 / S3, left to right · seconds"
        panelId="telemetry-sector-comparison"
        headerRight={!embedMode && onEmbedPanel ? <EmbedPanelButton onClick={() => onEmbedPanel('telemetry-sector-comparison')} /> : undefined}
      >
        {sectorRows.some((row) => row.total) ? (
          <div className="space-y-4">
            {sectorRows.filter((row) => row.s1 != null || row.s2 != null || row.s3 != null).map((row) => {
              const total = (row.s1 || 0) + (row.s2 || 0) + (row.s3 || 0);
              const s1Width = total > 0 ? ((row.s1 || 0) / total) * 100 : 0;
              const s2Width = total > 0 ? ((row.s2 || 0) / total) * 100 : 0;
              const s3Width = total > 0 ? ((row.s3 || 0) / total) * 100 : 0;
              return (
                <div key={row.name} className="grid gap-2 md:grid-cols-[74px_1fr_88px] md:items-center md:gap-3">
                  <div className="flex items-center justify-between text-xs font-semibold tracking-[0.04em] md:block">
                    <span className="standing-driver"><i className="driver-marker" style={{ background: row.color }} />{row.name}</span>
                    <span className="text-right text-sm font-semibold font-mono text-[color:var(--text-soft)] md:hidden">{fmtLap(row.total ?? null)}</span>
                  </div>
                  <div className="overflow-hidden">
                    <div className="sector-strip">
                      <div style={{ width: `${s1Width}%` }}>{row.s1?.toFixed(3) ?? '—'}</div>
                      <div style={{ width: `${s2Width}%` }}>{row.s2?.toFixed(3) ?? '—'}</div>
                      <div style={{ width: `${s3Width}%` }}>{row.s3?.toFixed(3) ?? '—'}</div>
                    </div>
                  </div>
                  <div className="hidden text-right text-sm font-semibold font-mono text-[color:var(--text-soft)] md:block">{fmtLap(row.total ?? null)}</div>
                </div>
              );
            })}
          </div>
        ) : lapsLoading ? <TableSkeleton rows={4} label="Building sector split..." /> : <NoData msg="No sector comparison available for this lap." />}
      </Panel>

      <ChartPanel title="Lap Times Comparison" sub={lapsLoading ? 'Loading lap data...' : `${driverNums.map((num) => driverMap[num]?.name_acronym).filter(Boolean).join(' vs ')} — excludes pit out-laps`} className="overflow-hidden" exportName="lap-times-comparison" legend={driverLegend} panelId="telemetry-lap-times" embedMode={embedMode} onEmbedPanel={onEmbedPanel}>
        {lapsLoading ? <ChartSkeleton label="Loading lap time data..." className="h-[180px] sm:h-[220px]" /> : lapTimeData.some((point) => Object.keys(point).length > 1) ? (
          <div className="h-[180px] sm:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lapTimeData} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="lap" ticks={lapTicks} interval={0} tick={AXIS_TICK} stroke={chartGrid} />
                <YAxis domain={['auto', 'auto']} allowDecimals={false} tick={AXIS_TICK} stroke={chartGrid} tickFormatter={formatLapAxis} />
                <Tooltip content={<ChartTip unit="s" labelPrefix="Lap " />} />
                {driverNums.map((driverNumber) => (
                  <Line key={driverNumber} type="monotone" dataKey={`t_${driverNumber}`} stroke={driverColor(driverNumber)} strokeDasharray={driverDash(driverNumber)} strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="No lap time data yet. Select drivers above." />}
      </ChartPanel>

      <ChartPanel title="Gap To Best Lap" sub="Per-lap delta to the fastest selected driver on that same lap" className="overflow-hidden" exportName="gap-to-best-lap" legend={driverLegend} panelId="telemetry-gap-best" embedMode={embedMode} onEmbedPanel={onEmbedPanel}>
        {lapsLoading ? <ChartSkeleton label="Loading gap trend data..." className="h-[160px] sm:h-[200px]" /> : lapDeltaData.some((point) => Object.keys(point).length > 1) ? (
          <div className="h-[160px] sm:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lapDeltaData} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="lap" ticks={lapTicks} interval={0} tick={AXIS_TICK} stroke={chartGrid} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} stroke={chartGrid} label={{ value: 'ms', angle: -90, position: 'insideLeft', ...AXIS_TICK_SOFT }} />
                <Tooltip content={<ChartTip unit="ms" labelPrefix="Lap " />} />
                {driverNums.map((driverNumber) => (
                  <Line key={driverNumber} type="monotone" dataKey={`d_${driverNumber}`} stroke={driverColor(driverNumber)} strokeDasharray={driverDash(driverNumber)} strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="Gap trend needs comparable lap times from at least two selected drivers." />}
      </ChartPanel>
    </PanelSelection>
  );
});
