import { describe, it, expect } from 'vitest';
import { buildTransform, MAP_W, MAP_H, PADDING, subsample } from '../trackMapUtils';

describe('buildTransform', () => {
  it('returns null for empty input', () => {
    expect(buildTransform([])).toBeNull();
  });

  it('returns a function for non-empty input', () => {
    const t = buildTransform([{ x: 0, y: 0 }, { x: 100, y: 100 }]);
    expect(typeof t).toBe('function');
  });

  it('maps the bounding box extremes to within the padded viewport', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];
    const t = buildTransform(points)!;

    const topLeft = t({ x: 0, y: 0 });
    const bottomRight = t({ x: 100, y: 100 });

    // All output coords must be within [PADDING, MAP_W-PADDING] / [PADDING, MAP_H-PADDING]
    expect(topLeft.nx).toBeGreaterThanOrEqual(PADDING);
    expect(topLeft.ny).toBeLessThanOrEqual(MAP_H - PADDING);
    expect(bottomRight.nx).toBeLessThanOrEqual(MAP_W - PADDING);
    expect(bottomRight.ny).toBeGreaterThanOrEqual(PADDING);
  });

  it('flips the Y axis (higher GPS y → lower SVG ny)', () => {
    const t = buildTransform([{ x: 0, y: 0 }, { x: 0, y: 100 }])!;
    const low = t({ x: 0, y: 0 });
    const high = t({ x: 0, y: 100 });
    // In SVG, lower ny = higher on screen; GPS y=100 should appear above GPS y=0
    expect(high.ny).toBeLessThan(low.ny);
  });

  it('handles a single point without crashing (range clamped to 1)', () => {
    const t = buildTransform([{ x: 42, y: 17 }]);
    expect(t).not.toBeNull();
    const pt = t!({ x: 42, y: 17 });
    expect(Number.isFinite(pt.nx)).toBe(true);
    expect(Number.isFinite(pt.ny)).toBe(true);
  });

  it('preserves relative horizontal ordering', () => {
    const t = buildTransform([{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 100, y: 0 }])!;
    const left   = t({ x: 0,   y: 0 });
    const middle = t({ x: 100, y: 0 });
    const right  = t({ x: 200, y: 0 });
    expect(left.nx).toBeLessThan(middle.nx);
    expect(middle.nx).toBeLessThan(right.nx);
  });
});

describe('subsample', () => {
  it('returns the original array when length <= max', () => {
    const arr = [1, 2, 3];
    expect(subsample(arr, 5)).toBe(arr);
    expect(subsample(arr, 3)).toBe(arr);
  });

  it('returns a smaller array when length > max', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i);
    const result = subsample(arr, 10);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result[0]).toBe(0);
  });
});
