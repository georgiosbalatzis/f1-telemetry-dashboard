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
  return (
    <>
      <Panel title="DRS Activation" icon={<Zap size={14} className="text-cyan-400" />} sub={`${driverMap[driverNums[0]]?.name_acronym || '—'} — Lap ${lapNum} · DRS values ≥ 10 = active`}>
        {telemetryLoading ? <Spinner /> : speedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="idx" tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
              <YAxis domain={[0, 1.2]} ticks={[0, 1]} tickFormatter={(value: number) => value >= 1 ? 'OPEN' : 'CLOSED'} tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
              <Tooltip content={<ChartTip />} />
              <Area type="stepAfter" dataKey="drs" stroke="#22D3EE" fill="#22D3EE" fillOpacity={0.15} strokeWidth={2} name="DRS" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <NoData msg="No car data for this lap. Try a race session lap." />}
      </Panel>

      <Panel title="Gear & RPM" icon={<Gauge size={14} className="text-amber-500" />}>
        {speedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
              <XAxis dataKey="idx" tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
              <YAxis yAxisId="gear" domain={[0, 9]} ticks={[1, 2, 3, 4, 5, 6, 7, 8]} tick={{ fill: '#555', fontSize: 10 }} stroke="#ffffff06" />
              <YAxis yAxisId="rpm" orientation="right" domain={[0, 15000]} tick={{ fill: '#333', fontSize: 9 }} stroke="#ffffff04" />
              <Tooltip content={<ChartTip />} />
              <Line yAxisId="gear" type="stepAfter" dataKey="gear" stroke="#F59E0B" strokeWidth={2} dot={false} name="Gear" />
              <Line yAxisId="rpm" type="monotone" dataKey="rpm" stroke="#ffffff15" strokeWidth={0.8} dot={false} name="RPM" />
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData msg="No data." />}
      </Panel>
    </>
  );
}
