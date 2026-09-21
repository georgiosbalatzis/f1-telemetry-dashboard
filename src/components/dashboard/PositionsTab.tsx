import { useMemo } from 'react';
import { TrendingDown } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpenF1Position } from '../../api/openf1';
import { teamColor } from '../../constants/colors';
import { useDriverContext } from '../../contexts/useDriverContext';
import { CardGridSkeleton, ChartSkeleton, ChartTip, NoData, Panel } from './shared';
import { ChartPanel } from './ChartPanel';
import type { ChartLegendItem } from './ChartPanel';
import { buildPositionChartData } from './positionsUtils';

type Props = {
  positions: OpenF1Position[] | null;
  positionsLoading: boolean;
  lapNum: number;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

export function PositionsTab({ positions, positionsLoading, lapNum, embedMode = false, onEmbedPanel }: Props) {
  const { driverNums, driverMap, driverColor } = useDriverContext();
  const chartGrid = 'var(--chart-grid)';
  const chartAxis = 'var(--chart-axis)';

  const { chartData, totalLaps, driverCount } = useMemo(
    () => buildPositionChartData(positions ?? []),
    [positions],
  );

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

  if (positionsLoading) {
    return (
      <>
        <Panel
          title="Current Standings"
          icon={<TrendingDown size={14} style={{ color: 'var(--accent)' }} />}
          sub="Loading latest recorded positions"
        >
          <CardGridSkeleton count={10} label="Loading race positions..." />
        </Panel>
        <ChartPanel
          title="Position History"
          icon={<TrendingDown size={14} style={{ color: 'var(--accent-strong)' }} />}
          sub="Loading position history"
          exportName="position-history"
          legend={legend}
          panelId="positions-history"
          embedMode={embedMode}
          onEmbedPanel={onEmbedPanel}
        >
          <ChartSkeleton label="Loading position history..." className="h-[200px] sm:h-[280px]" />
        </ChartPanel>
      </>
    );
  }
  if (!positions || positions.length === 0) {
    return (
      <Panel title="Race Positions" icon={<TrendingDown size={14} style={{ color: 'var(--accent)' }} />}>
        <NoData msg="No position data for this session. Race positions are available for race and sprint sessions." />
      </Panel>
    );
  }

  return (
    <>
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
                <CartesianGrid vertical={false} stroke={chartGrid} />
                <XAxis dataKey="t" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} label={{ value: 'Session progress →', position: 'insideBottomRight', offset: -4, fill: chartAxis, fontSize: 10 }} />
                <YAxis
                  reversed
                  domain={[1, 20]}
                  ticks={[1, 5, 10, 15, 20]}
                  tick={{ fill: chartAxis, fontSize: 10 }}
                  stroke={chartGrid}
                  label={{ value: 'Position', angle: -90, position: 'insideLeft', fill: chartAxis, fontSize: 10 }}
                />
                <Tooltip content={<ChartTip discrete labelPrefix="Session sample · " />} />
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

      {/* Current standings */}
      <Panel
        title="Current Standings"
        icon={<TrendingDown size={14} style={{ color: 'var(--accent)' }} />}
        sub={`Latest recorded positions · ${driverCount} drivers`}
      >
        <div className="standings-list">
          {positionTable.map((entry) => {
            const driver = driverMap[entry.driver_number];
            const color = teamColor(driver?.team_colour);
            return (
              <div
                key={entry.driver_number}
                className="standing-row"
              >
                <span>{entry.position}</span>
                <strong className="standing-driver"><i className="driver-marker" style={{ background: color }} />{driver?.name_acronym ?? `#${entry.driver_number}`}</strong>
                <small>{driver?.team_name ?? ''}</small>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="data-note">
        <div className="text-[10px] uppercase tracking-[0.06em] text-[color:var(--text-dim)]">Data note</div>
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
