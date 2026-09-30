import type { OpenF1Location } from '../../api/openf1';
import type { SvgPoint } from './trackMapUtils';

/** The lap is cut into this many equal-length stretches, like the mini-sectors on a timing screen. */
export const MINI_SECTORS = 25;

type Path = Pick<OpenF1Location, 'date' | 'x' | 'y'>[];

/** Seconds elapsed since the first sample at each of `bins + 1` equal steps of path length. */
export function timesAtPathFractions(path: Path, bins: number): number[] | null {
  const pts = path.map((p) => ({ t: Date.parse(p.date), x: p.x, y: p.y })).filter((p) => Number.isFinite(p.t));
  if (pts.length < 2) return null;
  const dist = [0];
  for (let i = 1; i < pts.length; i += 1) dist.push(dist[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = dist[dist.length - 1];
  if (total <= 0) return null;
  const times: number[] = [];
  let j = 0;
  for (let k = 0; k <= bins; k += 1) {
    const target = (k / bins) * total;
    while (j < dist.length - 2 && dist[j + 1] < target) j += 1;
    const width = dist[j + 1] - dist[j];
    const fraction = width > 0 ? Math.min(1, Math.max(0, (target - dist[j]) / width)) : 0;
    times.push((pts[j].t + fraction * (pts[j + 1].t - pts[j].t) - pts[0].t) / 1000);
  }
  return times;
}

/** For each equal-length stretch, the driver who covered it in the least time (null without at least two paths). */
export function stretchWinners(byDriver: Record<number, Path>, bins = MINI_SECTORS): (number | null)[] {
  const timed = Object.entries(byDriver).flatMap(([number, path]) => {
    const times = timesAtPathFractions(path, bins);
    return times ? [{ number: Number(number), times }] : [];
  });
  if (timed.length < 2) return [];
  return Array.from({ length: bins }, (_, k) => timed.reduce((best, item) => (item.times[k + 1] - item.times[k] < best.times[k + 1] - best.times[k] ? item : best)).number);
}

/** Point lists for each of `bins` equal-length stretches of a drawn path. */
export function stretchPolylines(points: SvgPoint[], bins = MINI_SECTORS): string[] {
  if (points.length < 2) return [];
  const dist = [0];
  for (let i = 1; i < points.length; i += 1) dist.push(dist[i - 1] + Math.hypot(points[i].nx - points[i - 1].nx, points[i].ny - points[i - 1].ny));
  const total = dist[dist.length - 1];
  if (total <= 0) return [];
  const at = (d: number): SvgPoint => {
    let j = 0;
    while (j < dist.length - 2 && dist[j + 1] < d) j += 1;
    const width = dist[j + 1] - dist[j];
    const f = width > 0 ? Math.min(1, Math.max(0, (d - dist[j]) / width)) : 0;
    return { nx: points[j].nx + f * (points[j + 1].nx - points[j].nx), ny: points[j].ny + f * (points[j + 1].ny - points[j].ny) };
  };
  return Array.from({ length: bins }, (_, k) => {
    const from = (k / bins) * total;
    const to = ((k + 1) / bins) * total;
    const inner = points.filter((_, i) => dist[i] > from && dist[i] < to);
    return [at(from), ...inner, at(to)].map((p) => `${p.nx.toFixed(1)},${p.ny.toFixed(1)}`).join(' ');
  });
}
