import { useMemo } from 'react';
import { Gauge } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpenF1Driver, OpenF1Interval } from '../../api/openf1';
import { ChartTip, NoData, Panel, Spinner, Stat } from './shared';
import { ChartPanel } from './ChartPanel';
import type { ChartLegendItem } from './ChartPanel';

type Props = {
  driverNums: number[];
  driverMap: Record<number, OpenF1Driver>;
  intervals: OpenF1Interval[] | null;
  intervalsLoading: boolean;
  driverColor: (driverNumber: number) => string;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

const DRS_THRESHOLD = 1.0;
const MAX_CHART_POINTS = 120;
const MAX_GAP_DISPLAY = 60; // cap gaps at 60s to avoid outliers from safety cars crushing the chart

export function IntervalsTab({ driverNums, driverMap, intervals, intervalsLoading, driverColor, embedMode = false, onEmbedPanel }: Props) {
  const chartGrid = 'var(--chart-grid)';
  const chartAxis = 'var(--chart-axis)';

  const { chartData, latestGaps, drsWindows } = useMemo(() => {
    if (!intervals || intervals.length === 0) {
      return { chartData: [], latestGaps: [], drsWindows: [] };
    }

    const byDriver: Record<number, OpenF1Interval[]> = {};
    for (const entry of intervals) {
      (byDriver[entry.driver_number] ||= []).push(entry);
    }

    const activeDrvs = driverNums.filter((n) => byDriver[n]?.length > 0);

    // Time-sampled chart
    const allDates = intervals.map((p) => new Date(p.date).getTime());
    const tMin = Math.min(...allDates);
    const tMax = Math.max(...allDates);
    const duration = tMax - tMin || 1;
    const N = MAX_CHART_POINTS;

    const data = Array.from({ length: N }, (_, i) => {
      const t = tMin + (i / (N - 1)) * duration;
      const point: Record<string, number | string> = { t: i + 1 };
      for (const n of activeDrvs) {
        const samples = byDriver[n];
        let best: OpenF1Interval | null = null;
        let bestDiff = Infinity;
        for (const s of samples) {
          const diff = Math.abs(new Date(s.date).getTime() - t);
          if (diff < bestDiff) { bestDiff = diff; best = s; }
        }
        if (best?.gap_to_leader != null) {
          const gap = Math.min(best.gap_to_leader, MAX_GAP_DISPLAY);
          if (gap >= 0) point[`gap_${n}`] = gap;
        }
        if (best?.interval != null && best.interval >= 0) {
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
        (s) => s.interval != null && s.interval <= DRS_THRESHOLD && s.interval >= 0,
      ).length;
      const pct = samples.length > 0 ? Math.round((drsCount / samples.length) * 100) : 0;
      return { driverNum: n, drsCount, pct };
    });

    return { chartData: data, latestGaps: latest, drsWindows: windows };
  }, [intervals, driverNums]);

  const legend = useMemo<ChartLegendItem[]>(
    () => driverNums
      .filter((n) => chartData.some((pt) => pt[`gap_${n}`] != null))
      .map((n) => ({ label: driverMap[n]?.name_acronym || `#${n}`, color: driverColor(n) })),
    [chartData, driverNums, driverMap, driverColor],
  );

  if (intervalsLoading) return <Spinner label="Loading interval data…" />;
  if (!intervals || intervals.length === 0) {
    return (
      <Panel title="Intervals & Battles" icon={<Gauge size={14} style={{ color: 'var(--accent)' }} />}>
        <NoData msg="No interval data for this session. Interval data is available for race and sprint race sessions." />
      </Panel>
    );
  }

  return (
    <>
      {/* Current gaps */}
      {latestGaps.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {latestGaps.slice(0, 8).map((entry) => {
            const color = driverColor(entry.driver_number);
            const isSelected = driverNums.includes(entry.driver_number);
            const gap = entry.gap_to_leader;
            const interval = entry.interval;
            return (
              <div
                key={entry.driver_number}
                className="dashboard-card rounded-[12px] p-3"
                style={isSelected ? { borderColor: `${color}55` } : undefined}
              >
                <div className="mb-1 text-[10px] uppercase tracking-[0.18em]" style={{ color }}>
                  {driverMap[entry.driver_number]?.name_acronym ?? `#${entry.driver_number}`}
                </div>
                <div className="text-lg font-black font-mono text-[color:var(--text-strong)]">
                  {gap != null && gap > 0 ? `+${gap.toFixed(3)}s` : gap === 0 ? 'Leader' : '—'}
                </div>
                {interval != null && interval >= 0 && (
                  <div
                    className="mt-1 text-[10px] font-mono"
                    style={{ color: interval <= DRS_THRESHOLD ? 'var(--accent)' : 'var(--text-dim)' }}
                  >
                    {interval <= DRS_THRESHOLD ? '● DRS ' : ''}+{interval.toFixed(3)}s ahead
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DRS battle summary */}
      {drsWindows.some((w) => w.drsCount > 0) && (
        <Panel
          title="DRS Window Time"
          icon={<Gauge size={14} style={{ color: 'var(--accent)' }} />}
          sub={`Proportion of session where each driver was within ${DRS_THRESHOLD}s of the car ahead`}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {drsWindows.map(({ driverNum, drsCount, pct }) => (
              <Stat
                key={driverNum}
                label={driverMap[driverNum]?.name_acronym ?? `#${driverNum}`}
                value={`${pct}%`}
                unit={`${drsCount} samples`}
                color={driverColor(driverNum)}
              />
            ))}
          </div>
        </Panel>
      )}

      {/* Gap to leader chart */}
      <ChartPanel
        title="Gap to Leader"
        icon={<Gauge size={14} style={{ color: 'var(--accent)' }} />}
        sub={`${driverNums.map((n) => driverMap[n]?.name_acronym).filter(Boolean).join(' vs ')} — gaps capped at ${MAX_GAP_DISPLAY}s`}
        exportName="gap-to-leader"
        legend={legend}
        panelId="intervals-gap-to-leader"
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      >
        {chartData.length > 0 ? (
          <div className="h-[200px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="t" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} label={{ value: 'Session progress →', position: 'insideBottomRight', offset: -4, fill: chartAxis, fontSize: 10 }} />
                <YAxis tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} tickFormatter={(v: number) => `+${v.toFixed(0)}s`} />
                <Tooltip content={<ChartTip />} />
                <ReferenceLine y={DRS_THRESHOLD} stroke="var(--accent)" strokeDasharray="5 4" label={{ value: 'DRS 1s', fill: 'var(--accent)', fontSize: 9, position: 'right' }} />
                {driverNums.map((n) => (
                  <Line
                    key={n}
                    type="monotone"
                    dataKey={`gap_${n}`}
                    stroke={driverColor(n)}
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

      {/* Interval to car ahead chart */}
      <ChartPanel
        title="Gap to Car Ahead"
        icon={<Gauge size={14} style={{ color: 'var(--accent-strong)' }} />}
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
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="t" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
                <YAxis tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} domain={[0, 5]} tickFormatter={(v: number) => `${v.toFixed(1)}s`} />
                <Tooltip content={<ChartTip />} />
                <ReferenceLine y={DRS_THRESHOLD} stroke="var(--accent)" strokeDasharray="5 4" label={{ value: 'DRS', fill: 'var(--accent)', fontSize: 9, position: 'right' }} />
                {driverNums.map((n) => (
                  <Line
                    key={n}
                    type="monotone"
                    dataKey={`int_${n}`}
                    stroke={driverColor(n)}
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

      <div className="dashboard-card rounded-[12px] p-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-dim)]">Data note</div>
        <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--text-muted)]">
          Gaps from OpenF1 <code className="font-mono text-[color:var(--text-soft)]">/intervals</code>.
          The blue dashed line marks the 1.0s DRS activation threshold.
          Gaps above {MAX_GAP_DISPLAY}s (e.g. safety car periods) are clamped for readability.
        </p>
      </div>
    </>
  );
}
