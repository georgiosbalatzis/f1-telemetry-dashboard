export type SectorClass = 'purple' | 'green' | 'yellow' | 'none';

export type IndexedSectorTime = {
  index: number;
  time: number;
};

export type SectorAnalysisData = {
  s1Classes: SectorClass[];
  s2Classes: SectorClass[];
  s3Classes: SectorClass[];
  bestI1: number | null;
  bestI2: number | null;
  bestSt: number | null;
};
