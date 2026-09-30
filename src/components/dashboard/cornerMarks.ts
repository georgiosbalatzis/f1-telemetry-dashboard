import type { ComparisonPoint } from './types';

type CornerMark = { progress: number; label: string };

const HALF_WINDOW = 6; // a corner is the lowest speed within ±6 points (~5% of the lap)
const REACH = 30;      // and the speed must climb at least MIN_PROMINENCE on both sides within ±30 points
const MIN_PROMINENCE = 25; // km/h
const MIN_GAP = 3;     // progress units between two marks

/**
 * Slowest points of a lap found from one driver's speed trace, numbered in driving order.
 * The numbers count these stretches only: they are not the circuit's official turn numbers.
 */
export function cornerMarks(points: ComparisonPoint[], driverNumber: number, label: (n: number) => string): CornerMark[] {
  const speeds = points.map((point) => point[`speed_${driverNumber}`]);
  if (speeds.some((speed) => speed == null)) return [];
  const v = speeds as number[];
  const max = (from: number, to: number) => Math.max(...v.slice(Math.max(0, from), Math.min(v.length, to + 1)));
  const found: number[] = [];
  for (let i = 1; i < v.length - 1; i += 1) {
    const window = v.slice(Math.max(0, i - HALF_WINDOW), Math.min(v.length, i + HALF_WINDOW + 1));
    if (v[i] !== Math.min(...window) || (i > 0 && v[i - 1] === v[i] && found[found.length - 1] === i - 1)) continue;
    const prominence = Math.min(max(i - REACH, i - 1), max(i + 1, i + REACH)) - v[i];
    if (prominence < MIN_PROMINENCE) continue;
    if (found.length && points[i].progress - points[found[found.length - 1]].progress < MIN_GAP) continue;
    found.push(i);
  }
  return found.map((index, order) => ({ progress: points[index].progress, label: label(order + 1) }));
}
