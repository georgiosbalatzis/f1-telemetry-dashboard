import { PanelSelection } from './shared';
import { useMemo, memo } from 'react';
import type { DriverLapSummary, SectorRow } from './types';
import { buildSectorAnalysis } from './broadcast/broadcastUtils';
import { TimingTower } from './broadcast/TimingTower';
import { SectorAnalysis } from './broadcast/SectorAnalysis';
import { SpeedTrap } from './broadcast/SpeedTrap';
import { DriverCards } from './broadcast/DriverCards';
import { GapCard } from './GapCard';
import type { GapCardData } from './gapCardData';

type Props = {
  lapNum: number;
  lapsLoading: boolean;
  sectorRows: SectorRow[];
  lapSummaries: DriverLapSummary[];
  gapCards: GapCardData[];
  sessionTitle: string;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

export const BroadcastTab = memo(function BroadcastTab({
  lapNum,
  lapsLoading,
  sectorRows,
  lapSummaries,
  gapCards,
  sessionTitle,
  embedMode = false,
  onEmbedPanel,
}: Props) {
  // lapSummaries is already ordered fastest first (untimed drivers last) with gaps filled in.
  const sorted = useMemo(() => lapSummaries.filter((summary) => summary.lapTime != null), [lapSummaries]);

  const { s1Classes, s2Classes, s3Classes, bestI1, bestI2, bestSt } = useMemo(
    () => buildSectorAnalysis(sectorRows),
    [sectorRows],
  );

  const summaryByName = useMemo(
    () =>
      Object.fromEntries(lapSummaries.map((s) => [s.name, s])) as Record<string, DriverLapSummary>,
    [lapSummaries],
  );

  const sectorRowMetaByName = useMemo(
    () =>
      Object.fromEntries(
        sectorRows.map((row, index) => [row.name, { row, index }]),
      ) as Record<string, { row: SectorRow; index: number }>,
    [sectorRows],
  );

  const hasSectors    = sectorRows.some((r) => r.total != null);
  const hasSpeedTraps = sectorRows.some((r) => r.i1 != null || r.i2 != null || r.st != null);

  return (
    <PanelSelection embedMode={embedMode}>
      <TimingTower key="broadcast-timing-tower"
        lapNum={lapNum}
        lapsLoading={lapsLoading}
        sorted={sorted}
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      />

      {gapCards.length > 0 && (
        <div key="broadcast-gap-cards" className="gap-cards">
          {gapCards.map((card) => <GapCard key={card.driverNumber} card={card} context={`${sessionTitle} · L${lapNum}`} />)}
        </div>
      )}

      <SectorAnalysis key="broadcast-sector-analysis"
        lapsLoading={lapsLoading}
        hasSectors={hasSectors}
        sectorRows={sectorRows}
        s1Classes={s1Classes}
        s2Classes={s2Classes}
        s3Classes={s3Classes}
        summaryByName={summaryByName}
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      />

      {hasSpeedTraps && (
        <SpeedTrap key="broadcast-speed-traps"
          sectorRows={sectorRows}
          bestI1={bestI1}
          bestI2={bestI2}
          bestSt={bestSt}
          embedMode={embedMode}
          onEmbedPanel={onEmbedPanel}
        />
      )}

      <DriverCards key="broadcast-driver-cards"
        sorted={sorted}
        s1Classes={s1Classes}
        s2Classes={s2Classes}
        s3Classes={s3Classes}
        sectorRowMetaByName={sectorRowMetaByName}
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      />
    </PanelSelection>
  );
});
