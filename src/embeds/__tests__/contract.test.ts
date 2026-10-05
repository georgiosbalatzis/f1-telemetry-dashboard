import { describe, expect, it } from 'vitest';
import fixture from './fixtures/publication-v1.json';
import { MAX_BUNDLE_BYTES, parseFigureBundle, serializeFigureBundle, validateFigureBundle, validateInteractiveFigurePayload } from '../contract';

const bundle = () => parseFigureBundle(JSON.stringify(fixture));

describe('publication v1', () => {
  it('validates the plot-only runtime payload without requiring the four fallback SVGs', () => {
    const { images: _images, ...payload } = bundle();
    expect(() => validateInteractiveFigurePayload(payload)).not.toThrow();
    expect(() => validateInteractiveFigurePayload({ ...payload, images: _images })).toThrow(/unexpected field/);
  });
  it('round-trips the cross-repository fixture without mutating it or converting missing values', () => {
    const input = bundle();
    input.data.points[1].speed_1 = null;
    const before = structuredClone(input);
    expect(parseFigureBundle(serializeFigureBundle(input))).toEqual(before);
    expect(input).toEqual(before);
  });

  it.each([
    ['unknown version', (x: ReturnType<typeof bundle>) => { Object.assign(x, { schemaVersion: 2 }); }],
    ['panel/tab mismatch', (x: ReturnType<typeof bundle>) => { Object.assign(x.scope, { tab: 'radio' }); }],
    ['panel/data mismatch', (x: ReturnType<typeof bundle>) => { x.data.kind = 'pedals'; }],
    ['duplicate driver', (x: ReturnType<typeof bundle>) => { x.scope.driverNums = [1, 1]; }],
    ['reordered metadata', (x: ReturnType<typeof bundle>) => { x.data.drivers.reverse(); }],
    ['unknown point key', (x: ReturnType<typeof bundle>) => { x.data.points[0].rpm_1 = 10000; }],
    ['NaN', (x: ReturnType<typeof bundle>) => { x.data.points[0].speed_1 = NaN; }],
    ['infinity', (x: ReturnType<typeof bundle>) => { x.data.points[0].speed_1 = Infinity; }],
    ['unordered progress', (x: ReturnType<typeof bundle>) => { x.data.points[1].progress = -1; }],
    ['invalid colour', (x: ReturnType<typeof bundle>) => { x.data.drivers[0].teamColour = 'url(x)'; }],
    ['invalid dash', (x: ReturnType<typeof bundle>) => { x.data.drivers[0].lineDash = 'url(x)'; }],
    ['inconsistent count', (x: ReturnType<typeof bundle>) => { x.provenance.drivers[0].sampleCount = 0; }],
    ['pending status', (x: ReturnType<typeof bundle>) => { Object.assign(x.provenance.drivers[0], { status: 'loading' }); }],
    ['missing image', (x: ReturnType<typeof bundle>) => { Reflect.deleteProperty(x.images, 'wideLight'); }],
    ['empty image dimensions', (x: ReturnType<typeof bundle>) => { x.images.wideLight.width = 0; }],
    ['overlong title', (x: ReturnType<typeof bundle>) => { x.editorial.title = 'x'.repeat(161); }],
    ['invalid timestamp', (x: ReturnType<typeof bundle>) => { x.capturedAt = '2026-02-30T00:00:00.000Z'; }],
  ])('rejects %s', (_label, change) => {
    const input = bundle();
    change(input);
    expect(() => validateFigureBundle(input)).toThrow(/Invalid telemetry publication/);
  });

  it('requires acknowledged and consistent partial comparisons', () => {
    const input = bundle();
    input.provenance.drivers[1] = { driverNumber: 4, status: 'missing', sampleCount: 0 };
    input.data.points.forEach((point) => { point.speed_4 = null; });
    expect(() => validateFigureBundle(input)).toThrow(/partialAcknowledged/);
    input.provenance.partialAcknowledged = true;
    expect(() => validateFigureBundle(input)).not.toThrow();
    input.data.points[0].speed_4 = 200;
    expect(() => validateFigureBundle(input)).toThrow(/completeness mismatch/);
  });

  it('preserves sample-axis fallback and never calls its samples progress', () => {
    const input = bundle();
    input.data.axis = 'sample';
    input.data.points = [{ idx: 0, speed: 210 }, { idx: 1, speed: 200 }];
    expect(() => validateFigureBundle(input)).toThrow(/multiple complete drivers/);
    input.provenance.drivers[1] = { driverNumber: 4, status: 'missing', sampleCount: 0 };
    input.provenance.partialAcknowledged = true;
    expect(parseFigureBundle(serializeFigureBundle(input)).data.axis).toBe('sample');
    input.data.guides = [{ progress: 30, label: 'C1' }];
    expect(() => validateFigureBundle(input)).toThrow(/sample axis/);
  });

  it('bounds untrusted JSON before parsing and bounds series', () => {
    expect(() => parseFigureBundle(' '.repeat(MAX_BUNDLE_BYTES + 1))).toThrow(/size limit/);
    const input = bundle();
    input.data.points = Array.from({ length: 4097 }, () => ({ progress: 0, speed_1: 200 }));
    expect(() => validateFigureBundle(input)).toThrow(/data.points/);
    expect(() => parseFigureBundle('{"__proto__":{}}')).toThrow(/unexpected field/);
  });
});
