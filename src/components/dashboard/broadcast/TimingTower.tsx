import { Tv2 } from 'lucide-react';
import { useDriverContext } from '../../../contexts/useDriverContext';
import type { DriverLapSummary } from '../types';
import { EmbedPanelButton, NoData, Panel, TableSkeleton } from '../shared';
import { fmtLap } from '../utils';

type TimingTowerProps = {
  lapNum: number;
  lapsLoading: boolean;
  /** lapSummaries pre-sorted by lap time ascending */
  sorted: DriverLapSummary[];
  leaderTime: number | null;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

export function TimingTower({
  lapNum,
  lapsLoading,
  sorted,
  leaderTime,
  embedMode = false,
  onEmbedPanel,
}: TimingTowerProps) {
  const { driverMap } = useDriverContext();
  return (
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
      {sorted.length === 0 ? (
        lapsLoading ? (
          <TableSkeleton rows={6} label="Loading timing data…" />
        ) : (
          <NoData msg="No lap data for the selected drivers." />
        )
      ) : (
        <table className="bc-tower" aria-label="Timing tower">
          <thead>
            <tr className="bc-tower-header">
              <th scope="col" className="bc-tower-col-bar">
                <span className="sr-only">Team colour</span>
              </th>
              <th scope="col" className="bc-tower-col-pos">P</th>
              <th scope="col" className="bc-tower-col-driver">Driver</th>
              <th scope="col" className="bc-tower-col-time">Lap Time</th>
              <th scope="col" className="bc-tower-col-gap">Gap</th>
              <th scope="col" className="bc-tower-col-speed">Top Speed</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((summary, index) => {
              const pos      = index + 1;
              const driver   = driverMap[summary.driverNumber];
              const color    = summary.color;
              const isLeader = pos === 1;
              const gap =
                !isLeader && leaderTime != null && summary.lapTime != null
                  ? summary.lapTime - leaderTime
                  : null;

              return (
                <tr key={summary.driverNumber} className="bc-tower-row">
                  <td className="bc-tower-col-bar">
                    <div className="bc-tower-bar" style={{ backgroundColor: color }} />
                    <span className="sr-only">
                      {driver?.team_name ?? driver?.name_acronym ?? `Driver ${summary.driverNumber}`} team colour
                    </span>
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
                  <td className="bc-tower-col-time bc-tower-laptime">{fmtLap(summary.lapTime)}</td>
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
  );
}
