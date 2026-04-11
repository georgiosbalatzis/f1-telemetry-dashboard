import { Timer } from 'lucide-react';
import { COLORS } from '../../../constants/colors';
import type { DriverLapSummary, SectorRow } from '../types';
import { EmbedPanelButton, NoData, Panel, TableSkeleton } from '../shared';
import { fmtLap } from '../utils';
import type { SectorClass } from './broadcastTypes';
import { SECTOR_STYLE } from './broadcastUtils';

function SectorCell({ time, cls }: { time: number | null | undefined; cls: SectorClass }) {
  const s = SECTOR_STYLE[cls];
  return (
    <td
      className="bc-sector-cell"
      style={{
        color:      time != null ? s.text : 'var(--text-dim)',
        background: time != null ? s.bg   : 'transparent',
      }}
    >
      {time?.toFixed(3) ?? '—'}
    </td>
  );
}

type SectorAnalysisProps = {
  lapsLoading: boolean;
  hasSectors: boolean;
  sectorRows: SectorRow[];
  s1Classes: SectorClass[];
  s2Classes: SectorClass[];
  s3Classes: SectorClass[];
  summaryByName: Record<string, DriverLapSummary>;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

export function SectorAnalysis({
  lapsLoading,
  hasSectors,
  sectorRows,
  s1Classes,
  s2Classes,
  s3Classes,
  summaryByName,
  embedMode = false,
  onEmbedPanel,
}: SectorAnalysisProps) {
  return (
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
          <TableSkeleton rows={6} label="Loading sector data…" />
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
                    <td className="bc-sector-laptime">{fmtLap(row.total ?? null)}</td>
                    <td className="bc-sector-gap">
                      {summary?.gapToLeader != null && summary.gapToLeader <= 0.0001 ? (
                        <span className="bc-badge-leader">LEADER</span>
                      ) : summary?.gapToLeader != null ? (
                        `+${summary.gapToLeader.toFixed(3)}`
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="bc-sector-legend">
            <span className="bc-sector-legend-item" style={{ color: COLORS.sector.fastest }}>■ FASTEST</span>
            <span className="bc-sector-legend-item" style={{ color: COLORS.sector.second }}>■ 2ND FASTEST</span>
            <span className="bc-sector-legend-item" style={{ color: COLORS.sector.slower }}>■ SLOWER</span>
          </div>
        </div>
      )}
    </Panel>
  );
}
