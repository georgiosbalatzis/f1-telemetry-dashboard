import { useMemo } from 'react';
import { Gauge, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OpenF1Driver } from '../../api/openf1';
import type { ComparisonPoint, DriverLapSummary, SpeedPoint } from './types';
import { ChartTip, NoData, Spinner } from './shared';
import { ChartPanel, type ChartLegendItem } from './ChartPanel';

type Props = {
  lapNum: number;
  driverNums: number[];
  driverMap: Record<number, OpenF1Driver>;
  speedData: SpeedPoint[];
  comparisonEnergyData: ComparisonPoint[];
  lapSummaries: DriverLapSummary[];
  driverColor: (driverNumber: number) => string;
  telemetryLoading: boolean;
};

export function EnergyTab({
  lapNum,
  driverNums,
  driverMap,
  speedData,
  comparisonEnergyData,
  lapSummaries,
  driverColor,
  telemetryLoading,
}: Props) {
  const chartGrid = 'var(--chart-grid)';
  const chartAxis = 'var(--chart-axis)';
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
      color: driverColor(driverNumber),
    })),
    [comparisonDriverNums, comparisonMode, driverColor, driverMap, driverNums],
  );
  const primaryDriverNumber = driverNums[0];
  const primaryDriverLabel = driverMap[primaryDriverNumber]?.name_acronym || '—';

  return (
    <>
      {lapSummaries.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {lapSummaries.map((summary) => (
            <div key={summary.driverNumber} className="dashboard-card rounded-[18px] p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="text-xs font-black tracking-[0.22em]" style={{ color: summary.color }}>{summary.name}</span>
                <span className="text-[10px] font-mono text-[color:var(--text-muted)]">
                  {summary.gapToLeader != null && summary.gapToLeader > 0 ? `+${summary.gapToLeader.toFixed(3)}s` : `L${lapNum}`}
                </span>
              </div>
              <div className="mb-3 text-xl font-black font-mono text-[color:var(--text-strong)] sm:text-2xl">{summary.lapTime != null ? `${summary.lapTime.toFixed(3)}s` : '—'}</div>
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
        legend={comparisonMode ? energyLegend : [{ label: 'DRS', color: 'var(--accent)', variant: 'area' }]}
      >
        {telemetryLoading ? <Spinner /> : comparisonMode ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={comparisonEnergyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="progress" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} unit="%" />
              <YAxis domain={[0, 1.1]} ticks={[0, 1]} tickFormatter={(value: number) => value >= 1 ? 'OPEN' : 'CLOSED'} tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
              <Tooltip content={<ChartTip />} />
              {comparisonDriverNums.map((driverNumber) => (
                <Line key={driverNumber} type="stepAfter" dataKey={`drs_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={2} dot={false} connectNulls name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : speedData.length > 0 ? (
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
      </ChartPanel>

      <ChartPanel
        title="Gear Trace"
        icon={<Gauge size={14} style={{ color: 'var(--accent-strong)' }} />}
        sub={comparisonMode
          ? `${comparisonDriverNums.map((driverNumber) => driverMap[driverNumber]?.name_acronym || `#${driverNumber}`).join(' vs ')} — shift map normalized by lap progress`
          : `${primaryDriverLabel} — Lap ${lapNum}`}
        exportName={`gear-trace-lap-${lapNum}`}
        legend={comparisonMode ? energyLegend : [{ label: 'Gear', color: 'var(--accent-strong)' }]}
      >
        {telemetryLoading ? <Spinner /> : comparisonMode ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={comparisonEnergyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="progress" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} unit="%" />
              <YAxis domain={[0, 9]} ticks={[1, 2, 3, 4, 5, 6, 7, 8]} tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
              <Tooltip content={<ChartTip />} />
              {comparisonDriverNums.map((driverNumber) => (
                <Line key={driverNumber} type="stepAfter" dataKey={`gear_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={2} dot={false} connectNulls name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : speedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="idx" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
              <YAxis domain={[0, 9]} ticks={[1, 2, 3, 4, 5, 6, 7, 8]} tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
              <Tooltip content={<ChartTip />} />
              <Line type="stepAfter" dataKey="gear" stroke="var(--accent-strong)" strokeWidth={2} dot={false} name="Gear" />
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData msg="No data." />}
      </ChartPanel>

      <ChartPanel
        title="RPM Trace"
        icon={<Gauge size={14} style={{ color: chartRpm }} />}
        sub={comparisonMode
          ? `${comparisonDriverNums.map((driverNumber) => driverMap[driverNumber]?.name_acronym || `#${driverNumber}`).join(' vs ')} — engine speed normalized by lap progress`
          : `${primaryDriverLabel} — Lap ${lapNum}`}
        exportName={`rpm-trace-lap-${lapNum}`}
        legend={comparisonMode ? energyLegend : [{ label: 'RPM', color: chartRpm }]}
      >
        {telemetryLoading ? <Spinner /> : comparisonMode ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={comparisonEnergyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="progress" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} unit="%" />
              <YAxis domain={[0, 15000]} tick={{ fill: chartAxis, fontSize: 9 }} stroke={chartGrid} />
              <Tooltip content={<ChartTip />} />
              {comparisonDriverNums.map((driverNumber) => (
                <Line key={driverNumber} type="monotone" dataKey={`rpm_${driverNumber}`} stroke={driverColor(driverNumber)} strokeWidth={1.8} dot={false} connectNulls name={driverMap[driverNumber]?.name_acronym || `#${driverNumber}`} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : speedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="idx" tick={{ fill: chartAxis, fontSize: 10 }} stroke={chartGrid} />
              <YAxis domain={[0, 15000]} tick={{ fill: chartAxis, fontSize: 9 }} stroke={chartGrid} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="rpm" stroke={chartRpm} strokeWidth={1.2} dot={false} name="RPM" />
            </LineChart>
          </ResponsiveContainer>
        ) : <NoData msg="No data." />}
      </ChartPanel>
    </>
  );
}
