import { LayoutGrid } from 'lucide-react';
import { useDriverContext } from '../../../contexts/useDriverContext';
import type { DriverLapSummary, SectorRow } from '../types';
import { EmbedPanelButton, Panel } from '../shared';
import { fmtLap } from '../utils';
import type { SectorClass } from './broadcastTypes';
import { SECTOR_STYLE } from './broadcastUtils';

type DriverCardsProps = {
  sorted: DriverLapSummary[];
  s1Classes: SectorClass[];
  s2Classes: SectorClass[];
  s3Classes: SectorClass[];
  sectorRowMetaByName: Record<string, { row: SectorRow; index: number }>;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

export function DriverCards({
  sorted,
  s1Classes,
  s2Classes,
  s3Classes,
  sectorRowMetaByName,
  embedMode = false,
  onEmbedPanel,
}: DriverCardsProps) {
  const { driverMap } = useDriverContext();
  if (sorted.length === 0) return null;

  return (
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
          const pos        = index + 1;
          const driver     = driverMap[summary.driverNumber];
          const color      = summary.color;
          const isLeader   = pos === 1;
          const sectorMeta = sectorRowMetaByName[driver?.name_acronym ?? `#${summary.driverNumber}`];
          const sectorRow  = sectorMeta?.row;

          return (
            <div key={summary.driverNumber} className="bc-driver-card">
              <div className="bc-driver-card-bar" style={{ backgroundColor: color }} />

              <div className="bc-driver-card-inner">
                {/* Header: position + driver identity */}
                <div className="bc-driver-card-header">
                  <div
                    className="bc-driver-card-pos"
                    style={{ color: isLeader ? color : 'var(--text-muted)' }}
                  >
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
                      <div className="bc-driver-card-team truncate">{driver?.team_name ?? ''}</div>
                    </div>
                  </div>
                </div>

                <div className="bc-driver-card-laptime">{fmtLap(summary.lapTime)}</div>

                {isLeader ? (
                  <div className="bc-badge-leader bc-driver-card-badge">LEADER</div>
                ) : summary.gapToLeader != null ? (
                  <div className="bc-driver-card-gap">+{summary.gapToLeader.toFixed(3)}</div>
                ) : null}

                {/* Sector mini-display */}
                {sectorMeta &&
                  sectorRow &&
                  (sectorRow.s1 != null || sectorRow.s2 != null || sectorRow.s3 != null) &&
                  (() => {
                    const allClasses = [
                      s1Classes[sectorMeta.index] ?? 'none',
                      s2Classes[sectorMeta.index] ?? 'none',
                      s3Classes[sectorMeta.index] ?? 'none',
                    ] as SectorClass[];
                    const times = [sectorRow.s1, sectorRow.s2, sectorRow.s3];
                    return (
                      <div className="bc-driver-card-sectors">
                        {times.map((t, i) => {
                          const cls = allClasses[i];
                          const s   = SECTOR_STYLE[cls];
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
                      {summary.topSpeed?.toFixed(0) ?? '—'}<span> km/h</span>
                    </div>
                  </div>
                  <div className="bc-driver-card-stat">
                    <div className="bc-driver-card-stat-label">Throttle</div>
                    <div className="bc-driver-card-stat-val">
                      {summary.avgThrottle?.toFixed(0) ?? '—'}<span>%</span>
                    </div>
                  </div>
                  <div className="bc-driver-card-stat">
                    <div className="bc-driver-card-stat-label">DRS Open</div>
                    <div className="bc-driver-card-stat-val">
                      {summary.drsOpenPct?.toFixed(0) ?? '—'}<span>%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
