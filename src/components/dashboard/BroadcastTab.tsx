import { useMemo } from 'react';
import { Gauge, LayoutGrid, Timer, Tv2 } from 'lucide-react';
import type { OpenF1Driver } from '../../api/openf1';
import type { DriverLapSummary, SectorRow } from './types';
import { EmbedPanelButton, NoData, Panel, Spinner } from './shared';
import { fmtLap } from './utils';

// ─── Sector Classification ─────────────────────────────────────────────────

type SectorClass = 'purple' | 'green' | 'yellow' | 'none';

const SECTOR_STYLE: Record<SectorClass, { text: string; bg: string }> = {
  purple: { text: '#bf00ff', bg: 'rgba(191,0,255,0.18)' },
  green:  { text: '#00c800', bg: 'rgba(0,200,0,0.16)' },
  yellow: { text: '#ffc906', bg: 'rgba(255,201,6,0.16)' },
  none:   { text: 'var(--text-muted)', bg: 'transparent' },
};

function classifySectors(rows: SectorRow[], field: 's1' | 's2' | 's3'): SectorClass[] {
  const times = rows.map((row) => row[field] ?? null);
  const valid = times.filter((t): t is number => t != null);
  if (valid.length === 0) return rows.map(() => 'none');

  const sorted = [...valid].sort((a, b) => a - b);
  const fastest = sorted[0];
  const second = sorted.length > 2 ? sorted[1] : null;

  return times.map((t) => {
    if (t == null) return 'none';
    if (t === fastest) return 'purple';
    if (second != null && t === second) return 'green';
    return 'yellow';
  });
}

// ─── Sector Time Cell ──────────────────────────────────────────────────────

function SectorCell({ time, cls }: { time: number | null | undefined; cls: SectorClass }) {
  const s = SECTOR_STYLE[cls];
  return (
    <td
      className="bc-sector-cell"
      style={{ color: time != null ? s.text : 'var(--text-dim)', background: time != null ? s.bg : 'transparent' }}
    >
      {time?.toFixed(3) ?? '—'}
    </td>
  );
}

// ─── Speed Cell ────────────────────────────────────────────────────────────

function SpeedCell({ speed, isBest }: { speed: number | null | undefined; isBest: boolean }) {
  return (
    <td
      className="bc-speed-cell"
      style={isBest && speed != null ? { color: '#bf00ff', background: 'rgba(191,0,255,0.12)' } : undefined}
    >
      {speed != null ? `${speed.toFixed(0)} km/h` : '—'}
    </td>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────

type Props = {
  lapNum: number;
  lapsLoading: boolean;
  sectorRows: SectorRow[];
  lapSummaries: DriverLapSummary[];
  driverNums: number[];
  driverMap: Record<number, OpenF1Driver>;
  driverColor: (driverNumber: number) => string;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

// ─── BroadcastTab ──────────────────────────────────────────────────────────

export function BroadcastTab({
  lapNum,
  lapsLoading,
  sectorRows,
  lapSummaries,
  driverNums,
  driverMap,
  driverColor,
  embedMode = false,
  onEmbedPanel,
}: Props) {
  // Sort by lap time for timing tower ordering
  const sorted = useMemo(
    () =>
      [...lapSummaries].sort((a, b) => {
        if (a.lapTime == null) return 1;
        if (b.lapTime == null) return -1;
        return a.lapTime - b.lapTime;
      }),
    [lapSummaries],
  );

  const leaderTime = sorted[0]?.lapTime ?? null;

  // Sector classifications
  const s1Classes = useMemo(() => classifySectors(sectorRows, 's1'), [sectorRows]);
  const s2Classes = useMemo(() => classifySectors(sectorRows, 's2'), [sectorRows]);
  const s3Classes = useMemo(() => classifySectors(sectorRows, 's3'), [sectorRows]);

  // Best speed trap readings (highest speed = purple)
  const bestI1 = useMemo(() => {
    const vals = sectorRows.map((r) => r.i1).filter((v): v is number => v != null);
    return vals.length > 0 ? Math.max(...vals) : null;
  }, [sectorRows]);
  const bestI2 = useMemo(() => {
    const vals = sectorRows.map((r) => r.i2).filter((v): v is number => v != null);
    return vals.length > 0 ? Math.max(...vals) : null;
  }, [sectorRows]);
  const bestSt = useMemo(() => {
    const vals = sectorRows.map((r) => r.st).filter((v): v is number => v != null);
    return vals.length > 0 ? Math.max(...vals) : null;
  }, [sectorRows]);

  const hasSectors = sectorRows.some((r) => r.total != null);
  const hasSpeedTraps = sectorRows.some((r) => r.i1 != null || r.i2 != null || r.st != null);

  return (
    <>
      {/* ── Timing Tower ──────────────────────────────────────────── */}
      <Panel
        title="Timing Tower"
        icon={<Tv2 size={14} style={{ color: 'var(--accent)' }} />}
        sub={`Lap ${lapNum} — selected drivers ranked by lap time`}
        panelId="broadcast-timing-tower"
        headerRight={
          embedMode && onEmbedPanel ? (
            <EmbedPanelButton onClick={() => onEmbedPanel('broadcast-timing-tower')} />
          ) : undefined
        }
      >
        {lapSummaries.length === 0 ? (
          lapsLoading ? (
            <Spinner label="Loading timing data…" />
          ) : (
            <NoData msg="No lap data for the selected drivers." />
          )
        ) : (
          <div className="bc-tower">
            {/* Header row */}
            <div className="bc-tower-header">
              <div className="bc-tower-col-bar" />
              <div className="bc-tower-col-pos">P</div>
              <div className="bc-tower-col-driver">Driver</div>
              <div className="bc-tower-col-time">Lap Time</div>
              <div className="bc-tower-col-gap">Gap</div>
              <div className="bc-tower-col-speed">Top Speed</div>
            </div>

            {sorted.map((summary, index) => {
              const pos = index + 1;
              const driver = driverMap[summary.driverNumber];
              const color = summary.color;
              const isLeader = pos === 1;
              const gap =
                !isLeader && leaderTime != null && summary.lapTime != null
                  ? summary.lapTime - leaderTime
                  : null;

              return (
                <div key={summary.driverNumber} className="bc-tower-row">
                  {/* Team color bar */}
                  <div className="bc-tower-col-bar">
                    <div className="bc-tower-bar" style={{ backgroundColor: color }} />
                  </div>

                  {/* Position */}
                  <div className={`bc-tower-col-pos bc-tower-pos${isLeader ? ' bc-tower-pos--leader' : ''}`}>
                    {pos}
                  </div>

                  {/* Driver */}
                  <div className="bc-tower-col-driver bc-tower-driver">
                    {driver?.headshot_url && (
                      <img
                        src={driver.headshot_url}
                        alt={driver.name_acronym}
                        className="bc-tower-avatar"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div>
                      <div className="bc-tower-acronym" style={{ color }}>
                        {driver?.name_acronym ?? `#${summary.driverNumber}`}
                      </div>
                      <div className="bc-tower-team">{driver?.team_name ?? ''}</div>
                    </div>
                  </div>

                  {/* Lap time */}
                  <div className="bc-tower-col-time bc-tower-laptime">
                    {fmtLap(summary.lapTime)}
                  </div>

                  {/* Gap */}
                  <div className="bc-tower-col-gap">
                    {isLeader ? (
                      <span className="bc-badge-leader">LEADER</span>
                    ) : gap != null ? (
                      <span className="bc-tower-gap">+{gap.toFixed(3)}</span>
                    ) : (
                      <span className="bc-tower-gap">—</span>
                    )}
                  </div>

                  {/* Top speed */}
                  <div className="bc-tower-col-speed bc-tower-speed">
                    {summary.topSpeed != null ? (
                      <>
                        <span className="bc-tower-speed-val">{summary.topSpeed.toFixed(0)}</span>
                        <span className="bc-tower-speed-unit">km/h</span>
                      </>
                    ) : (
                      <span className="bc-tower-speed-val" style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* ── Sector Analysis ───────────────────────────────────────── */}
      <Panel
        title="Sector Analysis"
        icon={<Timer size={14} style={{ color: 'var(--accent-strong)' }} />}
        sub="Purple = fastest · Green = 2nd fastest · Yellow = slower"
        panelId="broadcast-sector-analysis"
        headerRight={
          embedMode && onEmbedPanel ? (
            <EmbedPanelButton onClick={() => onEmbedPanel('broadcast-sector-analysis')} />
          ) : undefined
        }
      >
        {!hasSectors ? (
          lapsLoading ? (
            <Spinner label="Loading sector data…" />
          ) : (
            <NoData msg="No sector data available for this lap." />
          )
        ) : (
          <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
            <table className="bc-sector-table">
              <thead>
                <tr className="bc-sector-head">
                  <th className="bc-sector-th bc-sector-th--driver">Driver</th>
                  <th className="bc-sector-th">Sector 1</th>
                  <th className="bc-sector-th">Sector 2</th>
                  <th className="bc-sector-th">Sector 3</th>
                  <th className="bc-sector-th">Lap Time</th>
                  <th className="bc-sector-th bc-sector-th--right">Gap</th>
                </tr>
              </thead>
              <tbody>
                {sectorRows.map((row, rowIndex) => {
                  const summary = lapSummaries.find((s) => s.name === row.name);
                  return (
                    <tr key={row.name} className="bc-sector-row">
                      <td className="bc-sector-driver-cell">
                        <span className="bc-sector-driver-bar" style={{ backgroundColor: row.color }} />
                        <span className="bc-sector-driver-name" style={{ color: row.color }}>
                          {row.name}
                        </span>
                      </td>
                      <SectorCell time={row.s1} cls={s1Classes[rowIndex] ?? 'none'} />
                      <SectorCell time={row.s2} cls={s2Classes[rowIndex] ?? 'none'} />
                      <SectorCell time={row.s3} cls={s3Classes[rowIndex] ?? 'none'} />
                      <td className="bc-sector-laptime">
                        {fmtLap(row.total ?? null)}
                      </td>
                      <td className="bc-sector-gap">
                        {summary?.gapToLeader != null && summary.gapToLeader <= 0.0001
                          ? <span className="bc-badge-leader">LEADER</span>
                          : summary?.gapToLeader != null
                          ? `+${summary.gapToLeader.toFixed(3)}`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Sector color legend */}
            <div className="bc-sector-legend">
              <span className="bc-sector-legend-item" style={{ color: '#bf00ff' }}>■ FASTEST</span>
              <span className="bc-sector-legend-item" style={{ color: '#00c800' }}>■ 2ND FASTEST</span>
              <span className="bc-sector-legend-item" style={{ color: '#ffc906' }}>■ SLOWER</span>
            </div>
          </div>
        )}
      </Panel>

      {/* ── Speed Traps ───────────────────────────────────────────── */}
      {hasSpeedTraps && (
        <Panel
          title="Speed Traps"
          icon={<Gauge size={14} style={{ color: 'var(--accent-strong)' }} />}
          sub="Intermediate speed measurements and main straight trap — purple = fastest"
          panelId="broadcast-speed-traps"
          headerRight={
            embedMode && onEmbedPanel ? (
              <EmbedPanelButton onClick={() => onEmbedPanel('broadcast-speed-traps')} />
            ) : undefined
          }
        >
          <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
            <table className="bc-sector-table">
              <thead>
                <tr className="bc-sector-head">
                  <th className="bc-sector-th bc-sector-th--driver">Driver</th>
                  <th className="bc-sector-th">Intermediate 1</th>
                  <th className="bc-sector-th">Intermediate 2</th>
                  <th className="bc-sector-th">Speed Trap</th>
                </tr>
              </thead>
              <tbody>
                {sectorRows.map((row) => (
                  <tr key={row.name} className="bc-sector-row">
                    <td className="bc-sector-driver-cell">
                      <span className="bc-sector-driver-bar" style={{ backgroundColor: row.color }} />
                      <span className="bc-sector-driver-name" style={{ color: row.color }}>
                        {row.name}
                      </span>
                    </td>
                    <SpeedCell speed={row.i1} isBest={bestI1 != null && row.i1 === bestI1} />
                    <SpeedCell speed={row.i2} isBest={bestI2 != null && row.i2 === bestI2} />
                    <SpeedCell speed={row.st} isBest={bestSt != null && row.st === bestSt} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* ── Driver Broadcast Cards ─────────────────────────────────── */}
      {sorted.length > 0 && (
        <Panel
          title="Driver Cards"
          icon={<LayoutGrid size={14} style={{ color: 'var(--accent)' }} />}
          sub="Broadcast-style driver overview — ranked by lap time"
          panelId="broadcast-driver-cards"
          headerRight={
            embedMode && onEmbedPanel ? (
              <EmbedPanelButton onClick={() => onEmbedPanel('broadcast-driver-cards')} />
            ) : undefined
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {sorted.map((summary, index) => {
              const pos = index + 1;
              const driver = driverMap[summary.driverNumber];
              const color = summary.color;
              const isLeader = pos === 1;

              // Find sector data for this driver
              const sectorRow = sectorRows.find((r) => r.name === (driver?.name_acronym ?? `#${summary.driverNumber}`));

              return (
                <div key={summary.driverNumber} className="bc-driver-card">
                  {/* Top team color bar */}
                  <div className="bc-driver-card-bar" style={{ backgroundColor: color }} />

                  <div className="bc-driver-card-inner">
                    {/* Header: position + driver info */}
                    <div className="bc-driver-card-header">
                      <div className="bc-driver-card-pos" style={{ color: isLeader ? color : 'var(--text-muted)' }}>
                        P{pos}
                      </div>
                      <div className="bc-driver-card-identity">
                        {driver?.headshot_url && (
                          <img
                            src={driver.headshot_url}
                            alt={driver.name_acronym}
                            className="bc-driver-card-avatar"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="bc-driver-card-name" style={{ color }}>
                            {driver?.name_acronym ?? `#${summary.driverNumber}`}
                          </div>
                          <div className="bc-driver-card-team truncate">
                            {driver?.team_name ?? ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lap time */}
                    <div className="bc-driver-card-laptime">{fmtLap(summary.lapTime)}</div>

                    {/* Gap / Leader badge */}
                    {isLeader ? (
                      <div className="bc-badge-leader bc-driver-card-badge">LEADER</div>
                    ) : summary.gapToLeader != null ? (
                      <div className="bc-driver-card-gap">+{summary.gapToLeader.toFixed(3)}</div>
                    ) : null}

                    {/* Sector mini-display */}
                    {sectorRow && (sectorRow.s1 != null || sectorRow.s2 != null || sectorRow.s3 != null) && (() => {
                      const rowIdx = sectorRows.indexOf(sectorRow);
                      const classes = [
                        s1Classes[rowIdx] ?? 'none',
                        s2Classes[rowIdx] ?? 'none',
                        s3Classes[rowIdx] ?? 'none',
                      ];
                      const times = [sectorRow.s1, sectorRow.s2, sectorRow.s3];
                      return (
                        <div className="bc-driver-card-sectors">
                          {times.map((t, i) => {
                            const cls = classes[i];
                            const s = SECTOR_STYLE[cls];
                            return (
                              <div key={i} className="bc-driver-card-sector">
                                <div className="bc-driver-card-sector-label">S{i + 1}</div>
                                <div
                                  className="bc-driver-card-sector-time"
                                  style={{ color: t != null ? s.text : 'var(--text-dim)' }}
                                >
                                  {t?.toFixed(3) ?? '—'}
                                </div>
                                <div
                                  className="bc-driver-card-sector-indicator"
                                  style={{ backgroundColor: t != null ? s.text : 'var(--line)' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Stats row */}
                    <div className="bc-driver-card-stats">
                      <div className="bc-driver-card-stat">
                        <div className="bc-driver-card-stat-label">Top Speed</div>
                        <div className="bc-driver-card-stat-val">
                          {summary.topSpeed?.toFixed(0) ?? '—'}
                          <span> km/h</span>
                        </div>
                      </div>
                      <div className="bc-driver-card-stat">
                        <div className="bc-driver-card-stat-label">Throttle</div>
                        <div className="bc-driver-card-stat-val">
                          {summary.avgThrottle?.toFixed(0) ?? '—'}
                          <span>%</span>
                        </div>
                      </div>
                      <div className="bc-driver-card-stat">
                        <div className="bc-driver-card-stat-label">DRS Open</div>
                        <div className="bc-driver-card-stat-val">
                          {summary.drsOpenPct?.toFixed(0) ?? '—'}
                          <span>%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </>
  );
}
