import { Gauge, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpenF1Driver } from '../../api/openf1';
import type { SpeedPoint } from './types';
import { ChartTip, NoData, Panel, Spinner } from './shared';

type Props = {
  lapNum: number;
  driverNums: number[];
  driverMap: Record<number, OpenF1Driver>;
  speedData: SpeedPoint[];
  telemetryLoading: boolean;
};

export function EnergyTab({ lapNum, driverNums, driverMap, speedData, telemetryLoading }: Props) {
  const drsOpenPct = speedData.length > 0 ? Math.round((speedData.filter((point) => point.drs >= 1).length / speedData.length) * 100) : 0;
  const peakGear = speedData.length > 0 ? Math.max(...speedData.map((point) => point.gear)) : 0;
  const chartGrid = 'var(--chart-grid)';
  const chartAxis = 'var(--chart-axis)';
  const chartRpm = 'var(--chart-rpm)';

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="dashboard-card rounded-[18px] p-4">
          <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[color:var(--text-muted)]">DRS Window</div>
          <div className="text-3xl font-black text-[color:var(--accent)]">{drsOpenPct}%</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">lap spent with DRS open</div>
        </div>
        <div className="dashboard-card rounded-[18px] p-4">
          <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[color:var(--text-muted)]">Peak Gear</div>
          <div className="text-3xl font-black text-[color:var(--accent-strong)]">{peakGear || '—'}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">highest ratio on lap {lapNum}</div>
        </div>
      </div>

      <Panel title="DRS Activation" icon={<Zap size={14} style={{ color: 'var(--accent)' }} />} sub={`${driverMap[driverNums[0]]?.name_acronym || '—'} — Lap ${lapNum} · DRS values ≥ 10 = active`}>
        {telemetryLoading ? <Spinner /> : speedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="idx" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
              <YAxis domain={[0, 1.2]} ticks={[0, 1]} tickFormatter={(value: number) => value >= 1 ? 'OPEN' : 'CLOSED'} tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
              <Tooltip content={<ChartTip />} />
              <Area type="stepAfter" dataKey="drs" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.14} strokeWidth={2} name="DRS" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <NoData msg="No car data for this lap. Try a race session lap." />}
      </Panel>

      <Panel title="Gear & RPM" icon={<Gauge size={14} style={{ color: 'var(--accent-strong)' }} />}>
        {speedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="idx" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
              <YAxis yAxisId="gear" domain={[0, 9]} ticks={[1, 2, 3, 4, 5, 6, 7, 8]} tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
              <YAxis yAxisId="rpm" orientation="right" domain={[0, 15000]} tick={{ fill: chartAxis, fontSize: 9 }} stroke={chartGrid} />
              <Tooltip content={<ChartTip />} />
              <Line yAxisId="gear" type="stepAfter" dataKey="gear" stroke="var(--accent-strong)" strokeWidth={2} dot={false} name="Gear" />
              <Line yAxisId="rpm" type="monotone" dataKey="rpm" stroke={chartRpm} strokeWidth={0.8} dot={false} name="RPM" />
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData msg="No data." />}
      </Panel>
    </>
  );
}
