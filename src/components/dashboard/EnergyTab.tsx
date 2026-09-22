import { useMemo } from 'react';
import { Gauge, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDriverContext } from '../../contexts/useDriverContext';
import type { ComparisonPoint, DriverLapSummary, SpeedPoint } from './types';
import { PanelSelection, ChartSkeleton, ChartTip, NoData } from './shared';
import { ChartPanel, type ChartLegendItem } from './ChartPanel';
import { AXIS_TICK, CHART_MARGIN, PROGRESS_TICKS, evenTicks, useXTickCount } from './chartAxis';

type Props = {
  lapNum: number;
  speedData: SpeedPoint[];
  comparisonEnergyData: ComparisonPoint[];
  lapSummaries: DriverLapSummary[];
  telemetryLoading: boolean;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

export function EnergyTab({
  lapNum,
  speedData,
  comparisonEnergyData,
  lapSummaries,
  telemetryLoading,
  embedMode = false,
  onEmbedPanel,
}: Props) {
  const { driverNums, driverMap, driverColor, driverDash } = useDriverContext();
  const chartGrid = 'var(--chart-grid)';
  const sampleTicks = evenTicks(speedData.map((point) => point.idx), useXTickCount());
  const chartRpm = 'var(--chart-rpm)';
  const comparisonDriverNums = useMemo(
    () => driverNums.filter((driverNumber) => comparisonEnergyData.some((point) => (
      point[`drs_${driverNumber}`] != null
      || point[`gear_${driverNumber}`] != null
      || point[`rpm_${driverNumber}`] != null
    ))),
    [comparisonEnergyData, driverNums],
  );
  const comparisonMode = comparisonDriverNums.length >= 2;
  const energyLegend = useMemo<ChartLegendItem[]>(
    () => (comparisonMode ? comparisonDriverNums : driverNums.slice(0, 1)).map((driverNumber) => ({
      label: driverMap[driverNumber]?.name_acronym || `#${driverNumber}`,
      strokeDasharray: driverDash(driverNumber), color: driverColor(driverNumber),
    })),
    [comparisonDriverNums, comparisonMode, driverColor, driverDash, driverMap, driverNums],
  );
  const primaryDriverNumber = driverNums[0];
  const primaryDriverLabel = driverMap[primaryDriverNumber]?.name_acronym || '—';

  return (
    <PanelSelection embedMode={embedMode}>
      {lapSummaries.length > 0 && (
        <div className="lap-comparison">
          {lapSummaries.filter((summary) => summary.lapTime != null || summary.topSpeed != null).map((summary) => (
            <div key={summary.driverNumber} className="energy-summary">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="standing-driver text-xs font-semibold tracking-[0.04em]"><i className="driver-marker" style={{ background: summary.color }} />{summary.name}</span>
                <span className="text-[10px] font-mono text-[color:var(--text-muted)]">
                  {summary.gapToLeader != null && summary.gapToLeader > 0 ? `+${summary.gapToLeader.toFixed(3)}s` : `L${lapNum}`}
                </span>
              </div>
              <div className="mb-3 timing-value">{summary.lapTime != null ? `${summary.lapTime.toFixed(3)}s` : '—'}</div>
              <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                <div>
                  <div className="mb-1 text-[color:var(--text-dim)]">DRS</div>
                  <div className="text-sm font-bold text-[color:var(--text-soft)]">{summary.drsOpenPct != null ? `${summary.drsOpenPct}%` : '—'}</div>
                </div>
                <div>
                  <div className="mb-1 text-[color:var(--text-dim)]">Gear</div>
                  <div className="text-sm font-bold text-[color:var(--text-soft)]">{summary.peakGear ?? '—'}</div>
                </div>
                <div>
                  <div className="mb-1 text-[color:var(--text-dim)]">RPM</div>
                  <div className="text-sm font-bold text-[color:var(--text-soft)]">{summary.peakRpm?.toFixed(0) ?? '—'}</div>
                </div>
                <div>
                  <div className="mb-1 text-[color:var(--text-dim)]">Brake</div>
                  <div className="text-sm font-bold text-[color:var(--text-soft)]">{summary.avgBrake != null ? `${summary.avgBrake.toFixed(0)}%` : '—'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ChartPanel
        title="DRS Activation"
        icon={<Zap size={14} style={{ color: 'var(--accent)' }} />}
        sub={comparisonMode
          ? `${comparisonDriverNums.map((driverNumber) => driverMap[driverNumber]?.name_acronym || `#${driverNumber}`).join(' vs ')} — normalized by lap progress`
          : `${primaryDriverLabel} — Lap ${lapNum} · DRS values ≥ 10 = active`}
        exportName={`drs-activation-lap-${lapNum}`}
        legend={comparisonMode ? energyLegend : speedData.length > 0 ? [{ label: 'DRS', color: 'var(--accent)', variant: 'area' }] : []}
        panelId="energy-drs-activation"
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      >
        {telemetryLoading ? <ChartSkeleton label="Loading DRS data..." className="h-[120px] sm:h-[160px]" /> : comparisonMode ? (
          <div className="h-[120px] sm:h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonEnergyData} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="progress" type="number" domain={[0, 100]} ticks={PROGRESS_TICKS} tick={AXIS_TICK} stroke={chartGrid} unit="%" />
                <YAxis domain={[0, 1.1]} ticks={[0, 1]} tickFormatter={(value: number) => value >= 1 ? 'OPEN' : 'CLOSED'} tick={AXIS_TICK} stroke={chartGrid} />
                <Tooltip content={<ChartTip discrete labelPrefix="Lap progress · " />} />
                {comparisonDriverNums.map((driverNumber) => (
                  <Line key={driverNumber} type="stepAfter" dataKey={`drs_${driverNumber}`} stroke={driverColor(driverNumber)} strokeDasharray={driverDash(driverNumber)} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : speedData.length > 0 ? (
          <div className="h-[110px] sm:h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={speedData} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="idx" ticks={sampleTicks} interval={0} tick={AXIS_TICK} stroke={chartGrid} />
                <YAxis domain={[0, 1.2]} ticks={[0, 1]} tickFormatter={(value: number) => value >= 1 ? 'OPEN' : 'CLOSED'} tick={AXIS_TICK} stroke={chartGrid} />
                <Tooltip content={<ChartTip discrete labelPrefix="Sample · " />} />
                <Area type="stepAfter" dataKey="drs" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.14} strokeWidth={2} isAnimationActive={false} name="DRS" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="No car data for this lap. Try a race session lap." />}
      </ChartPanel>

      <ChartPanel
        title="Gear Trace"
        icon={<Gauge size={14} style={{ color: 'var(--accent-strong)' }} />}
        sub={comparisonMode
          ? `${comparisonDriverNums.map((driverNumber) => driverMap[driverNumber]?.name_acronym || `#${driverNumber}`).join(' vs ')} — shift map normalized by lap progress`
          : `${primaryDriverLabel} — Lap ${lapNum}`}
        exportName={`gear-trace-lap-${lapNum}`}
        legend={comparisonMode ? energyLegend : speedData.length > 0 ? [{ label: 'Gear', color: 'var(--accent-strong)' }] : []}
        panelId="energy-gear-trace"
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      >
        {telemetryLoading ? <ChartSkeleton label="Loading gear trace..." className="h-[140px] sm:h-[180px]" /> : comparisonMode ? (
          <div className="h-[140px] sm:h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonEnergyData} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="progress" type="number" domain={[0, 100]} ticks={PROGRESS_TICKS} tick={AXIS_TICK} stroke={chartGrid} unit="%" />
                <YAxis domain={[0, 9]} ticks={[1, 2, 3, 4, 5, 6, 7, 8]} tick={AXIS_TICK} stroke={chartGrid} />
                <Tooltip content={<ChartTip discrete labelPrefix="Lap progress · " />} />
                {comparisonDriverNums.map((driverNumber) => (
                  <Line key={driverNumber} type="stepAfter" dataKey={`gear_${driverNumber}`} stroke={driverColor(driverNumber)} strokeDasharray={driverDash(driverNumber)} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : speedData.length > 0 ? (
          <div className="h-[140px] sm:h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedData} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="idx" ticks={sampleTicks} interval={0} tick={AXIS_TICK} stroke={chartGrid} />
                <YAxis domain={[0, 9]} ticks={[1, 2, 3, 4, 5, 6, 7, 8]} tick={AXIS_TICK} stroke={chartGrid} />
                <Tooltip content={<ChartTip discrete labelPrefix="Sample · " />} />
                <Line type="stepAfter" dataKey="gear" stroke="var(--accent-strong)" strokeWidth={2} dot={false} isAnimationActive={false} name="Gear" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="No data." />}
      </ChartPanel>

      <ChartPanel
        title="RPM Trace"
        icon={<Gauge size={14} style={{ color: chartRpm }} />}
        sub={comparisonMode
          ? `${comparisonDriverNums.map((driverNumber) => driverMap[driverNumber]?.name_acronym || `#${driverNumber}`).join(' vs ')} — engine speed normalized by lap progress`
          : `${primaryDriverLabel} — Lap ${lapNum}`}
        exportName={`rpm-trace-lap-${lapNum}`}
        legend={comparisonMode ? energyLegend : speedData.length > 0 ? [{ label: 'RPM', color: chartRpm }] : []}
        panelId="energy-rpm-trace"
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      >
        {telemetryLoading ? <ChartSkeleton label="Loading RPM trace..." className="h-[140px] sm:h-[180px]" /> : comparisonMode ? (
          <div className="h-[140px] sm:h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonEnergyData} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="progress" type="number" domain={[0, 100]} ticks={PROGRESS_TICKS} tick={AXIS_TICK} stroke={chartGrid} unit="%" />
                <YAxis domain={[0, 15000]} ticks={[0, 5000, 10000, 15000]} tick={AXIS_TICK} stroke={chartGrid} tickFormatter={(value: number) => `${value / 1000}k`} />
                <Tooltip content={<ChartTip unit="rpm" discrete labelPrefix="Lap progress · " />} />
                {comparisonDriverNums.map((driverNumber) => (
                  <Line key={driverNumber} type="monotone" dataKey={`rpm_${driverNumber}`} stroke={driverColor(driverNumber)} strokeDasharray={driverDash(driverNumber)} strokeWidth={1.8} dot={false} connectNulls isAnimationActive={false} name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : speedData.length > 0 ? (
          <div className="h-[140px] sm:h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedData} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="idx" ticks={sampleTicks} interval={0} tick={AXIS_TICK} stroke={chartGrid} />
                <YAxis domain={[0, 15000]} ticks={[0, 5000, 10000, 15000]} tick={AXIS_TICK} stroke={chartGrid} tickFormatter={(value: number) => `${value / 1000}k`} />
                <Tooltip content={<ChartTip unit="rpm" discrete labelPrefix="Sample · " />} />
                <Line type="monotone" dataKey="rpm" stroke={chartRpm} strokeWidth={1.2} dot={false} isAnimationActive={false} name="RPM" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="No data." />}
      </ChartPanel>
    </PanelSelection>
  );
}
