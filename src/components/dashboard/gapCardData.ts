import type { CornerSplits } from './cornerSplits';
import type { DriverLapSummary, SectorRow } from './types';

export type GapCardData = {
  driverNumber: number;
  target: string;
  reference: string;
  referenceNumber: number;
  gap: number;
  lapTime: number;
  topSpeed: number | null;
  /** Target minus reference for S1, S2, S3 (seconds), null where a sector is missing. */
  sectors: (number | null)[];
  splits: CornerSplits | null;
};

/** One card per selected driver that is slower than the quickest lap; needs at least two timed laps. */
export function buildGapCards(
  summaries: DriverLapSummary[],
  sectorRows: SectorRow[],
  cornerSplits: { reference: number; byDriver: Record<number, CornerSplits> } | null,
): GapCardData[] {
  const timed = summaries.filter((summary): summary is DriverLapSummary & { lapTime: number } => summary.lapTime != null && summary.lapTime > 0);
  if (timed.length < 2) return [];
  const reference = timed.reduce((best, item) => (item.lapTime < best.lapTime ? item : best));
  const refRow = sectorRows.find((row) => row.name === reference.name);
  return timed
    .filter((summary) => summary.driverNumber !== reference.driverNumber)
    .sort((a, b) => a.lapTime - b.lapTime)
    .map((summary) => {
      const row = sectorRows.find((item) => item.name === summary.name);
      const delta = (key: 's1' | 's2' | 's3') => (row?.[key] != null && refRow?.[key] != null ? (row[key] as number) - (refRow[key] as number) : null);
      return {
        driverNumber: summary.driverNumber,
        target: summary.name,
        reference: reference.name,
        referenceNumber: reference.driverNumber,
        gap: summary.lapTime - reference.lapTime,
        lapTime: summary.lapTime,
        topSpeed: summary.topSpeed,
        sectors: [delta('s1'), delta('s2'), delta('s3')],
        splits: cornerSplits?.reference === reference.driverNumber ? cornerSplits.byDriver[summary.driverNumber] ?? null : null,
      };
    });
}
