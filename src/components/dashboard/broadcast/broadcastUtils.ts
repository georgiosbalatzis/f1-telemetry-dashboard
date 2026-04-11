import { COLORS } from '../../../constants/colors';
import type { SectorClass, IndexedSectorTime, SectorAnalysisData } from './broadcastTypes';
import type { SectorRow } from '../types';

export const SECTOR_STYLE: Record<SectorClass, { text: string; bg: string }> = {
  purple: { text: COLORS.sector.fastest,  bg: COLORS.sector.fastestBg },
  green:  { text: COLORS.sector.second,   bg: COLORS.sector.secondBg },
  yellow: { text: COLORS.sector.slower,   bg: COLORS.sector.slowerBg },
  none:   { text: 'var(--text-muted)',     bg: 'transparent' },
};

export function classifySectorEntries(entries: IndexedSectorTime[], rowCount: number): SectorClass[] {
  const classes = Array.from({ length: rowCount }, () => 'none' as SectorClass);
  if (entries.length === 0) return classes;

  const sorted = entries.slice().sort((left, right) => left.time - right.time);
  const fastest = sorted[0]?.time ?? null;
  const second  = sorted[1]?.time ?? null;

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

export function buildSectorAnalysis(rows: SectorRow[]): SectorAnalysisData {
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
