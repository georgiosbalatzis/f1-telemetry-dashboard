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

type IndexedSectorTime = {
  index: number;
  time: number;
};

type SectorAnalysis = {
  s1Classes: SectorClass[];
  s2Classes: SectorClass[];
  s3Classes: SectorClass[];
  bestI1: number | null;
  bestI2: number | null;
  bestSt: number | null;
};

function classifySectorEntries(entries: IndexedSectorTime[], rowCount: number): SectorClass[] {
  const classes = Array.from({ length: rowCount }, () => 'none' as SectorClass);
  if (entries.length === 0) return classes;

  const sorted = entries.slice().sort((left, right) => left.time - right.time);
  const fastest = sorted[0]?.time ?? null;
  const second = sorted[1]?.time ?? null;

  entries.forEach((entry) => {
    if (fastest != null && entry.time === fastest) {
      classes[entry.index] = 'purple';
    } else if (second != null && entry.time === second) {
      classes[entry.index] = 'green';
    } else {
      classes[entry.index] = 'yellow';
    }
  });

  return classes;
}

function buildSectorAnalysis(rows: SectorRow[]): SectorAnalysis {
  const s1: IndexedSectorTime[] = [];
  const s2: IndexedSectorTime[] = [];
  const s3: IndexedSectorTime[] = [];
  let bestI1: number | null = null;
  let bestI2: number | null = null;
  let bestSt: number | null = null;

  rows.forEach((row, index) => {
    if (row.s1 != null) s1.push({ index, time: row.s1 });
    if (row.s2 != null) s2.push({ index, time: row.s2 });
    if (row.s3 != null) s3.push({ index, time: row.s3 });
    if (row.i1 != null) bestI1 = bestI1 == null ? row.i1 : Math.max(bestI1, row.i1);
    if (row.i2 != null) bestI2 = bestI2 == null ? row.i2 : Math.max(bestI2, row.i2);
    if (row.st != null) bestSt = bestSt == null ? row.st : Math.max(bestSt, row.st);
  });

  return {
    s1Classes: classifySectorEntries(s1, rows.length),
    s2Classes: classifySectorEntries(s2, rows.length),
    s3Classes: classifySectorEntries(s3, rows.length),
    bestI1,
    bestI2,
    bestSt,
  };
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
  driverMap: Record<number, OpenF1Driver>;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

// ─── BroadcastTab ──────────────────────────────────────────────────────────

export function BroadcastTab({
  lapNum,
  lapsLoading,
  sectorRows,
  lapSummaries,
  driverMap,
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

  const { s1Classes, s2Classes, s3Classes, bestI1, bestI2, bestSt } = useMemo(
    () => buildSectorAnalysis(sectorRows),
    [sectorRows],
  );
  const summaryByName = useMemo(
    () => Object.fromEntries(lapSummaries.map((summary) => [summary.name, summary])) as Record<string, DriverLapSummary>,
    [lapSummaries],
  );
  const sectorRowMetaByName = useMemo(
    () => Object.fromEntries(sectorRows.map((row, index) => [row.name, { row, index }])) as Record<string, { row: SectorRow; index: number }>,
    [sectorRows],
  );

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
          <table className="bc-tower" aria-label="Timing tower">
            <thead>
              <tr className="bc-tower-header">
                <th scope="col" className="bc-tower-col-bar"><span className="sr-only">Team colour</span></th>
                <th scope="col" className="bc-tower-col-pos">P</th>
                <th scope="col" className="bc-tower-col-driver">Driver</th>
                <th scope="col" className="bc-tower-col-time">Lap Time</th>
                <th scope="col" className="bc-tower-col-gap">Gap</th>
                <th scope="col" className="bc-tower-col-speed">Top Speed</th>
              </tr>
            </thead>
            <tbody>
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
                  <tr key={summary.driverNumber} className="bc-tower-row">
                    <td className="bc-tower-col-bar">
                      <div className="bc-tower-bar" style={{ backgroundColor: color }} />
                      <span className="sr-only">{driver?.team_name ?? driver?.name_acronym ?? `Driver ${summary.driverNumber}`} team colour</span>
                    </td>
                    <td className={`bc-tower-col-pos bc-tower-pos${isLeader ? ' bc-tower-pos--leader' : ''}`}>
                      {pos}
                    </td>
                    <th scope="row" className="bc-tower-col-driver">
                      <div className="bc-tower-driver">
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
                    </th>
                    <td className="bc-tower-col-time bc-tower-laptime">
                      {fmtLap(summary.lapTime)}
                    </td>
                    <td className="bc-tower-col-gap">
                      {isLeader ? (
                        <span className="bc-badge-leader">LEADER</span>
                      ) : gap != null ? (
                        <span className="bc-tower-gap">+{gap.toFixed(3)}</span>
                      ) : (
                        <span className="bc-tower-gap">—</span>
                      )}
                    </td>
                    <td className="bc-tower-col-speed bc-tower-speed">
                      {summary.topSpeed != null ? (
                        <>
                          <span className="bc-tower-speed-val">{summary.topSpeed.toFixed(0)}</span>
                          <span className="bc-tower-speed-unit">km/h</span>
                        </>
                      ) : (
                        <span className="bc-tower-speed-val" style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                  const summary = summaryByName[row.name];
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
              const sectorMeta = sectorRowMetaByName[driver?.name_acronym ?? `#${summary.driverNumber}`];
              const sectorRow = sectorMeta?.row;

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
                    {sectorMeta && sectorRow && (sectorRow.s1 != null || sectorRow.s2 != null || sectorRow.s3 != null) && (() => {
                      const classes = [
                        s1Classes[sectorMeta.index] ?? 'none',
                        s2Classes[sectorMeta.index] ?? 'none',
                        s3Classes[sectorMeta.index] ?? 'none',
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
