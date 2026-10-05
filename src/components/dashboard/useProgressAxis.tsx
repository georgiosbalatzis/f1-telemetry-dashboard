import { useMemo } from 'react';
import { ReferenceLine } from 'recharts';
import { copy } from '../../copy';
import { AXIS_TICK, PROGRESS_TICKS, evenTicks, useXTickCount } from './chartAxis';
import { cornerMarks } from './cornerMarks';
import type { ComparisonPoint } from './types';

const GRID = 'var(--chart-grid)';

/**
 * X-axis props and dotted guides for charts on the shared lap-progress axis. When the data carries a full speed
 * series the axis names the slowest stretches of the lap (C1, C2 ...); otherwise it shows percentages.
 */
export function useProgressAxis(data: ComparisonPoint[], driverNums: number[]) {
  const xTickCount = useXTickCount();
  const marks = useMemo(() => {
    const driverNumber = driverNums.find((number) => data.length > 0 && data.every((point) => point[`speed_${number}`] != null));
    return driverNumber != null ? cornerMarks(data, driverNumber, copy.chart.corner) : [];
  }, [data, driverNums]);
  const named = marks.length > 0;
  const axis = {
    type: 'number' as const,
    domain: [0, 100] as [number, number],
    ticks: named ? evenTicks(marks.map((mark) => mark.progress), xTickCount) : PROGRESS_TICKS,
    tick: AXIS_TICK,
    stroke: GRID,
    unit: named ? undefined : '%',
    tickFormatter: named ? (value: number) => marks.find((mark) => mark.progress === value)?.label ?? '' : undefined,
  };
  const guides = marks.map((mark) => <ReferenceLine key={mark.progress} x={mark.progress} stroke={GRID} strokeDasharray="2 4" />);
  return { axis, guides, marks };
}
