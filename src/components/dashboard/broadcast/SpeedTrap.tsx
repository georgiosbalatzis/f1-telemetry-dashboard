import { Gauge } from 'lucide-react';
import { COLORS } from '../../../constants/colors';
import type { SectorRow } from '../types';
import { EmbedPanelButton, Panel } from '../shared';

function SpeedCell({ speed, isBest }: { speed: number | null | undefined; isBest: boolean }) {
  return (
    <td
      className="bc-speed-cell"
      style={
        isBest && speed != null
          ? { color: COLORS.sector.fastest, background: COLORS.sector.fastestBgSoft }
          : undefined
      }
    >
      {speed != null ? `${speed.toFixed(0)} km/h` : '—'}
    </td>
  );
}

type SpeedTrapProps = {
  sectorRows: SectorRow[];
  bestI1: number | null;
  bestI2: number | null;
  bestSt: number | null;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

export function SpeedTrap({
  sectorRows,
  bestI1,
  bestI2,
  bestSt,
  embedMode = false,
  onEmbedPanel,
}: SpeedTrapProps) {
  return (
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
  );
}
