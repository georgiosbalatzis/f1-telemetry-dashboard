import { expect, it } from 'vitest';
import { cornerMarks } from '../cornerMarks';

/** 120 points; speed dips to 90 at points 20, 60 and 100 on a 300 km/h base. */
const points = Array.from({ length: 120 }, (_, i) => ({
  progress: Math.round((i / 119) * 100),
  speed_1: 300 - [20, 60, 100].reduce((dip, c) => Math.max(dip, 210 - Math.abs(i - c) * 15), 0),
}));

it('finds the slow points in driving order and labels them', () => {
  const marks = cornerMarks(points, 1, (n) => `C${n}`);
  expect(marks.map((mark) => mark.label)).toEqual(['C1', 'C2', 'C3']);
  expect(marks[0].progress).toBeLessThan(marks[1].progress);
});

it('ignores shallow dips and returns nothing without a full speed series', () => {
  expect(cornerMarks(points.map((p) => ({ ...p, speed_1: 300 - (p.speed_1 < 300 ? 10 : 0) })), 1, String)).toEqual([]);
  expect(cornerMarks([{ progress: 0 }, { progress: 1 }], 1, String)).toEqual([]);
});
