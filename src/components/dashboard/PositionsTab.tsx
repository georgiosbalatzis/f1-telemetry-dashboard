import { useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpenF1Driver, OpenF1Position } from '../../api/openf1';
import { ChartTip, NoData, Panel, Spinner } from './shared';
import { ChartPanel } from './ChartPanel';
import type { ChartLegendItem } from './ChartPanel';

type Props = {
  driverNums: number[];
  driverMap: Record<number, OpenF1Driver>;
  positions: OpenF1Position[] | null;
  positionsLoading: boolean;
  lapNum: number;
  driverColor: (driverNumber: number) => string;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

const MAX_CHART_POINTS = 100;
type PositionSample = {
  position: number;
  timestamp: number;
};

export function PositionsTab({ driverNums, driverMap, positions, positionsLoading, lapNum, driverColor, embedMode = false, onEmbedPanel }: Props) {
  const chartGrid = 'var(--chart-grid)';
  const chartAxis = 'var(--chart-axis)';

  const { chartData, totalLaps, driverCount } = useMemo(() => {
    if (!positions || positions.length === 0) return { chartData: [], totalLaps: 0, driverCount: 0 };

    const byDriver = new Map<number, PositionSample[]>();
    let tMin = Number.POSITIVE_INFINITY;
    let tMax = Number.NEGATIVE_INFINITY;

    positions.forEach((entry) => {
      const timestamp = Date.parse(entry.date);
      if (!Number.isFinite(timestamp)) return;

      tMin = Math.min(tMin, timestamp);
      tMax = Math.max(tMax, timestamp);

      const samples = byDriver.get(entry.driver_number);
      const sample = { position: entry.position, timestamp };
      if (samples) {
        samples.push(sample);
      } else {
        byDriver.set(entry.driver_number, [sample]);
      }
    });

    const allDrivers = [...byDriver.keys()];
    if (allDrivers.length === 0 || !Number.isFinite(tMin) || !Number.isFinite(tMax)) {
      return { chartData: [], totalLaps: 0, driverCount: 0 };
    }

    byDriver.forEach((samples) => {
      samples.sort((left, right) => left.timestamp - right.timestamp);
    });

    const duration = tMax - tMin || 1;

    const bucketTimes = Array.from({ length: MAX_CHART_POINTS }, (_, index) => (
      tMin + (index / (MAX_CHART_POINTS - 1)) * duration
    ));
    const buckets = bucketTimes.map((_, index) => ({ t: index + 1 } as Record<string, number | string>));

    allDrivers.forEach((driverNumber) => {
      const samples = byDriver.get(driverNumber);
      if (!samples?.length) return;

      let pointer = 0;
      bucketTimes.forEach((bucketTime, bucketIndex) => {
        while (pointer + 1 < samples.length && samples[pointer + 1].timestamp <= bucketTime) {
          pointer += 1;
        }

        const current = samples[pointer];
        const next = samples[pointer + 1];
        const best = next && Math.abs(next.timestamp - bucketTime) < Math.abs(current.timestamp - bucketTime)
          ? next
          : current;
        buckets[bucketIndex][`p_${driverNumber}`] = best.position;
      });
    });

    const totalSamples = Math.max(0, ...allDrivers.map((driverNumber) => byDriver.get(driverNumber)?.length ?? 0));
    const estLaps = Math.round(totalSamples / 20);

    return { chartData: buckets, totalLaps: estLaps, driverCount: allDrivers.length };
  }, [positions]);

  const legend = useMemo<ChartLegendItem[]>(
    () => driverNums.map((n) => ({
      label: driverMap[n]?.name_acronym || `#${n}`,
      color: driverColor(n),
    })),
    [driverNums, driverMap, driverColor],
  );

  // Current lap position table
  const positionTable = useMemo(() => {
    if (!positions || positions.length === 0) return [];
    const latest: Record<number, OpenF1Position> = {};
    for (const p of positions) {
      if (!latest[p.driver_number] || p.date > latest[p.driver_number].date) {
        latest[p.driver_number] = p;
      }
    }
    return Object.values(latest)
      .sort((a, b) => a.position - b.position)
      .slice(0, 20);
  }, [positions]);

  if (positionsLoading) return <Spinner label="Loading race positions…" />;
  if (!positions || positions.length === 0) {
    return (
      <Panel title="Race Positions" icon={<TrendingDown size={14} style={{ color: 'var(--accent)' }} />}>
        <NoData msg="No position data for this session. Race positions are available for race and sprint sessions." />
      </Panel>
    );
  }

  return (
    <>
      {/* Current standings */}
      <Panel
        title="Current Standings"
        icon={<TrendingDown size={14} style={{ color: 'var(--accent)' }} />}
        sub={`Latest recorded positions · ${driverCount} drivers`}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {positionTable.map((entry) => {
            const driver = driverMap[entry.driver_number];
            const color = driver ? `#${driver.team_colour}` : '#888';
            const isSelected = driverNums.includes(entry.driver_number);
            return (
              <div
                key={entry.driver_number}
                className="dashboard-card rounded-[12px] p-3"
                style={isSelected ? { borderColor: `${color}55` } : undefined}
              >
                <div className="mb-1 text-2xl font-black text-[color:var(--text-strong)]">
                  P{entry.position}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color }}>
                  {driver?.name_acronym ?? `#${entry.driver_number}`}
                </div>
                <div className="mt-0.5 text-[10px] text-[color:var(--text-dim)]">
                  {driver?.team_name ?? ''}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Position history chart */}
      <ChartPanel
        title="Position History"
        icon={<TrendingDown size={14} style={{ color: 'var(--accent-strong)' }} />}
        sub={`${driverNums.map((n) => driverMap[n]?.name_acronym).filter(Boolean).join(' vs ')} — position over the session`}
        exportName="position-history"
        legend={legend}
        panelId="positions-history"
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      >
        {chartData.length > 0 ? (
          <div className="h-[200px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="t" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} label={{ value: 'Session progress →', position: 'insideBottomRight', offset: -4, fill: chartAxis, fontSize: 10 }} />
                <YAxis
                  reversed
                  domain={[1, 20]}
                  ticks={[1, 5, 10, 15, 20]}
                  tick={{ fill: chartAxis, fontSize: 10 }}
                  stroke={chartGrid}
                  label={{ value: 'Position', angle: -90, position: 'insideLeft', fill: chartAxis, fontSize: 10 }}
                />
                <Tooltip content={<ChartTip />} />
                <ReferenceLine y={lapNum} stroke="var(--accent-border)" strokeDasharray="4 3" />
                {driverNums.map((n) => (
                  <Line
                    key={n}
                    type="monotone"
                    dataKey={`p_${n}`}
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
        ) : <NoData msg="Not enough position data to draw a chart." />}
      </ChartPanel>

      <div className="dashboard-card rounded-[12px] p-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-dim)]">Data note</div>
        <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--text-muted)]">
          Race positions from OpenF1 <code className="font-mono text-[color:var(--text-soft)]">/position</code>.
          {totalLaps > 0 && ` Estimated ${totalLaps} laps of data.`}{' '}
          Chart X-axis shows time-sampled buckets across the full session duration.
          Select specific drivers above to highlight their position lines.
        </p>
      </div>
    </>
  );
}
