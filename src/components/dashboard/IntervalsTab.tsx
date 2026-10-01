import { useMemo, memo } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpenF1Interval } from '../../api/openf1';
import { teamColor } from '../../constants/colors';
import { useDriverContext } from '../../contexts/useDriverContext';
import { PanelSelection, CardGridSkeleton, ChartSkeleton, ChartTip, NoData, Panel, Stat } from './shared';
import { ChartPanel } from './ChartPanel';
import type { ChartLegendItem } from './ChartPanel';
import { AXIS_TICK, CHART_MARGIN, evenTicks, useXTickCount } from './chartAxis';
import { nearestPerBucket } from './positionsUtils';

type Props = {
  intervals: OpenF1Interval[] | null;
  intervalsLoading: boolean;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

const DRS_DETECTION_WINDOW_S = 1.0;
const MAX_CHART_POINTS = 120;
const MAX_GAP_DISPLAY = 60; // cap gaps at 60s to avoid outliers from safety cars crushing the chart

export const IntervalsTab = memo(function IntervalsTab({ intervals, intervalsLoading, embedMode = false, onEmbedPanel }: Props) {
  const { driverNums, driverMap, driverColor, driverDash } = useDriverContext();
  const chartGrid = 'var(--chart-grid)';
  const chartAxis = 'var(--chart-axis)';

  const { chartData, latestGaps, drsWindows } = useMemo(() => {
    if (!intervals || intervals.length === 0) {
      return { chartData: [], latestGaps: [], drsWindows: [] };
    }

    const byDriver: Record<number, OpenF1Interval[]> = {};
    const timed: Record<number, { timestamp: number; entry: OpenF1Interval }[]> = {};
    let tMin = Infinity;
    let tMax = -Infinity;
    for (const entry of intervals) {
      const timestamp = Date.parse(entry.date);
      if (!Number.isFinite(timestamp)) continue;
      (byDriver[entry.driver_number] ||= []).push(entry);
      (timed[entry.driver_number] ||= []).push({ timestamp, entry });
      if (timestamp < tMin) tMin = timestamp;
      if (timestamp > tMax) tMax = timestamp;
    }

    const activeDrvs = driverNums.filter((n) => byDriver[n]?.length > 0);

    // Time-sampled chart
    const duration = tMax - tMin || 1;
    const N = MAX_CHART_POINTS;
    const bucketTimes = Array.from({ length: N }, (_, i) => tMin + (i / (N - 1)) * duration);
    const nearest: Record<number, OpenF1Interval[]> = {};
    for (const n of activeDrvs) {
      nearest[n] = nearestPerBucket(timed[n].sort((a, b) => a.timestamp - b.timestamp), bucketTimes).map((sample) => sample.entry);
    }

    const data = bucketTimes.map((_, i) => {
      const point: Record<string, number | string> = { t: i + 1 };
      for (const n of activeDrvs) {
        const best = nearest[n][i];
        if (best.gap_to_leader != null) {
          const gap = Math.min(best.gap_to_leader, MAX_GAP_DISPLAY);
          if (gap >= 0) point[`gap_${n}`] = gap;
        }
        if (best.interval != null && best.interval >= 0) {
          point[`int_${n}`] = Math.min(best.interval, 10);
        }
      }
      return point;
    });

    // Latest gaps
    const latest: OpenF1Interval[] = activeDrvs.map((n) => {
      const samples = byDriver[n];
      return samples[samples.length - 1];
    }).filter(Boolean);

    // Count DRS-range samples per selected driver (gap_to_leader <= 1.0 && interval <= 1.0)
    const windows = activeDrvs.map((n) => {
      const samples = byDriver[n] ?? [];
      const drsCount = samples.filter(
        (s) => s.interval != null && s.interval <= DRS_DETECTION_WINDOW_S && s.interval >= 0,
      ).length;
      const pct = samples.length > 0 ? Math.round((drsCount / samples.length) * 100) : 0;
      return { driverNum: n, drsCount, pct };
    });

    return { chartData: data, latestGaps: latest, drsWindows: windows };
  }, [intervals, driverNums]);

  const sessionTicks = evenTicks(chartData.map((point) => point.t), useXTickCount());

  const legend = useMemo<ChartLegendItem[]>(
    () => driverNums
      .filter((n) => chartData.some((pt) => pt[`gap_${n}`] != null))
      .map((n) => ({ label: driverMap[n]?.name_acronym || `#${n}`, strokeDasharray: driverDash(n), color: driverColor(n) })),
    [chartData, driverNums, driverMap, driverColor, driverDash],
  );

  if (intervalsLoading) {
    return (
      <PanelSelection embedMode={embedMode}>
        <Panel lead
          title="Current Gaps"
          sub="Loading latest interval samples"
        >
          <CardGridSkeleton count={8} label="Loading interval data..." />
        </Panel>
        <ChartPanel
          title="Gap to Leader"
          sub="Loading gap history"
          exportName="gap-to-leader"
          legend={legend}
          panelId="intervals-gap-to-leader"
          embedMode={embedMode}
          onEmbedPanel={onEmbedPanel}
        >
          <ChartSkeleton label="Loading interval chart..." className="h-[200px] sm:h-[280px]" />
        </ChartPanel>
      </PanelSelection>
    );
  }
  if (!intervals || intervals.length === 0) {
    return (
      <Panel lead title="Intervals & Battles">
        <NoData msg="No interval data for this session. Interval data is available for race and sprint race sessions." />
      </Panel>
    );
  }

  return (
    <PanelSelection embedMode={embedMode}>
      {/* Gap to leader chart */}
      <ChartPanel lead
        title="Gap to Leader"
        sub={`${driverNums.map((n) => driverMap[n]?.name_acronym).filter(Boolean).join(' vs ')} — gaps capped at ${MAX_GAP_DISPLAY}s`}
        exportName="gap-to-leader"
        legend={legend}
        panelId="intervals-gap-to-leader"
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      >
        {latestGaps.length > 0 && (
          <div className="overflow-x-auto mb-6" tabIndex={0} role="region" aria-label="Current gaps, scroll horizontally for all columns">
            <table className="data-table">
              <thead><tr><th>Driver</th><th>Gap to leader</th><th>To car ahead</th><th>DRS</th></tr></thead>
              <tbody>{latestGaps.map((entry) => {
                const gap = entry.gap_to_leader;
                const interval = entry.interval;
                const isLeader = gap === 0; // the leader has no car ahead
                const inDrs = !isLeader && interval != null && interval >= 0 && interval <= DRS_DETECTION_WINDOW_S;
                return (
                  <tr key={entry.driver_number} className="interval-summary" style={{ ['--row-color' as string]: teamColor(driverMap[entry.driver_number]?.team_colour) }}>
                    <td>{driverMap[entry.driver_number]?.name_acronym ?? `#${entry.driver_number}`}</td>
                    <td className="total">{gap != null && gap > 0 ? `+${gap.toFixed(3)}s` : gap === 0 ? 'Leader' : '—'}</td>
                    <td>{!isLeader && interval != null && interval >= 0 ? `+${interval.toFixed(3)}s` : '—'}</td>
                    <td style={{ color: inDrs ? 'var(--accent)' : undefined }}>{inDrs ? '● DRS' : '—'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
        {chartData.length > 0 ? (
          <div className="h-[200px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="t" ticks={sessionTicks} interval={0} tick={AXIS_TICK} stroke={chartGrid} label={{ value: 'Session progress →', position: 'insideBottomRight', offset: -4, fill: chartAxis, fontSize: 10 }} />
                <YAxis tick={AXIS_TICK} stroke={chartGrid} tickFormatter={(v: number) => `+${v.toFixed(0)}s`} />
                <Tooltip content={<ChartTip unit="s" labelPrefix="Session sample · " />} />
                <ReferenceLine y={DRS_DETECTION_WINDOW_S} stroke="var(--accent)" strokeDasharray="5 4" label={{ value: 'DRS 1s', fill: 'var(--accent)', fontSize: 11, position: 'insideTopRight' }} />
                {driverNums.map((n) => (
                  <Line
                    key={n}
                    type="monotone"
                    dataKey={`gap_${n}`}
                    stroke={driverColor(n)} strokeDasharray={driverDash(n)}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                    name={driverMap[n]?.name_acronym || `#${n}`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="Not enough interval data for the selected drivers." />}
      </ChartPanel>

      {/* DRS battle summary */}
      {drsWindows.some((w) => w.drsCount > 0) && (
        <Panel
          title="DRS Window Time"
          sub={`Proportion of session where each driver was within ${DRS_DETECTION_WINDOW_S}s of the car ahead`}
        >
          <div className="lap-comparison">
            {drsWindows.map(({ driverNum, drsCount, pct }) => (
              <Stat
                key={driverNum}
                label={driverMap[driverNum]?.name_acronym ?? `#${driverNum}`}
                value={`${pct}%`}
                unit={`${drsCount} samples`}
                markerColor={driverColor(driverNum)}
              />
            ))}
          </div>
        </Panel>
      )}

      {/* Interval to car ahead chart */}
      <ChartPanel
        title="Gap to Car Ahead"
        sub="Time to the next car — below the 1s line means DRS is available"
        exportName="interval-to-ahead"
        legend={legend}
        panelId="intervals-gap-to-ahead"
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      >
        {chartData.length > 0 ? (
          <div className="h-[180px] sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={CHART_MARGIN}>
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="t" ticks={sessionTicks} interval={0} tick={AXIS_TICK} stroke={chartGrid} />
                <YAxis tick={AXIS_TICK} stroke={chartGrid} domain={[0, 5]} tickFormatter={(v: number) => `${v.toFixed(1)}s`} />
                <Tooltip content={<ChartTip unit="s" labelPrefix="Session sample · " />} />
                <ReferenceLine y={DRS_DETECTION_WINDOW_S} stroke="var(--accent)" strokeDasharray="5 4" label={{ value: 'DRS', fill: 'var(--accent)', fontSize: 11, position: 'insideTopRight' }} />
                {driverNums.map((n) => (
                  <Line
                    key={n}
                    type="monotone"
                    dataKey={`int_${n}`}
                    stroke={driverColor(n)} strokeDasharray={driverDash(n)}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                    name={driverMap[n]?.name_acronym || `#${n}`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <NoData msg="No interval data available." />}
      </ChartPanel>

      <div className="data-note">
        <div className="text-[10px] uppercase tracking-[0.06em] text-[color:var(--text-dim)]">Data note</div>
        <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--text-muted)]">
          Gaps from OpenF1 <code className="font-mono text-[color:var(--text-soft)]">/intervals</code>.
          The dashed reference line marks the 1.0s DRS activation threshold.
          Gaps above {MAX_GAP_DISPLAY}s (e.g. safety car periods) are clamped for readability.
        </p>
      </div>
    </PanelSelection>
  );
});
