import { useMemo } from 'react';
import type { DriverLapSummary, SectorRow } from './types';
import { buildSectorAnalysis } from './broadcast/broadcastUtils';
import { TimingTower } from './broadcast/TimingTower';
import { SectorAnalysis } from './broadcast/SectorAnalysis';
import { SpeedTrap } from './broadcast/SpeedTrap';
import { DriverCards } from './broadcast/DriverCards';

type Props = {
  lapNum: number;
  lapsLoading: boolean;
  sectorRows: SectorRow[];
  lapSummaries: DriverLapSummary[];
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

export function BroadcastTab({
  lapNum,
  lapsLoading,
  sectorRows,
  lapSummaries,
  embedMode = false,
  onEmbedPanel,
}: Props) {
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
    <>
      <TimingTower
        lapNum={lapNum}
        lapsLoading={lapsLoading}
        sorted={sorted}
        leaderTime={leaderTime}
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      />

      <SectorAnalysis
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
        <SpeedTrap
          sectorRows={sectorRows}
          bestI1={bestI1}
          bestI2={bestI2}
          bestSt={bestSt}
          embedMode={embedMode}
          onEmbedPanel={onEmbedPanel}
        />
      )}

      <DriverCards
        sorted={sorted}
        s1Classes={s1Classes}
        s2Classes={s2Classes}
        s3Classes={s3Classes}
        sectorRowMetaByName={sectorRowMetaByName}
        embedMode={embedMode}
        onEmbedPanel={onEmbedPanel}
      />
    </>
  );
}
