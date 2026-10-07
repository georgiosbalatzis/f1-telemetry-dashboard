import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { TelemetryPlot } from '../TelemetryPlot';
import { figureLegend, omitUnavailableFigureDrivers } from '../plotModel';
import { fixtureCases, plotFixture } from './fixtures';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('shared telemetry plots', () => {
  it.each(fixtureCases)('renders speed and pedals from offline %s data without changing it', (scenario) => {
    for (const kind of ['speed', 'pedals'] as const) {
      const data = plotFixture(kind, scenario);
      const before = structuredClone(data);
      const { container, unmount } = render(<TelemetryPlot data={data} width={340} />);
      expect(container.querySelector('svg.recharts-surface')).toHaveAttribute('width', '340');
      expect(container.querySelectorAll('.recharts-line-curve,.recharts-area-area').length).toBeGreaterThan(0);
      expect(container.textContent).toContain(kind === 'speed' ? 'km/h' : 'Throttle');
      expect(data).toEqual(before);
      unmount();
    }
  });

  it('uses container width for sample tick density and height, independently of page viewport', () => {
    const data = plotFixture('speed', 'sample');
    const { container, rerender } = render(<TelemetryPlot data={data} width={340} />);
    const ticks = () => container.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-value');
    expect(ticks()).toHaveLength(5);
    expect(container.querySelector('svg.recharts-surface')).toHaveAttribute('height', '240');
    rerender(<TelemetryPlot data={data} width={680} />);
    expect(ticks()).toHaveLength(10);
    expect(container.querySelector('svg.recharts-surface')).toHaveAttribute('height', '380');
  });

  it('keeps saved guide positions and teammate/channel distinctions', () => {
    const data = plotFixture('pedals', 'teammates');
    data.guides = [{ progress: 10, label: 'Saved C1' }, { progress: 80, label: 'Saved C2' }];
    const { container } = render(<TelemetryPlot data={data} width={680} theme="dark" />);
    expect(container.textContent).toContain('Saved C1');
    expect(container.textContent).toContain('Saved C2');
    const dashes = [...container.querySelectorAll('.recharts-line-curve')].map((node) => node.getAttribute('stroke-dasharray'));
    expect(dashes).toEqual([null, '10 4', '6 4', '10 3 2 3']);
    expect(figureLegend(data).map((item) => item.strokeDasharray)).toEqual([undefined, '6 4', '10 4', '10 3 2 3']);
  });

  it('keeps a partial comparison on the progress axis and omits the missing driver from the legend', () => {
    const data = plotFixture('speed', 'missing');
    expect(data.axis).toBe('progress');
    expect(figureLegend(data).map((item) => item.label)).toEqual(['VER']);
    expect(data.points.every((point) => typeof point.progress === 'number' && point.speed_4 === null)).toBe(true);
  });

  it('omits a selected driver whose requested lap is incomplete without mutating the live plot', () => {
    const data = plotFixture('pedals', 'teammates');
    const before = structuredClone(data);
    const publication = omitUnavailableFigureDrivers(data, new Set([data.drivers[0].number]));
    const unavailable = data.drivers[1].number;
    expect(publication.points.every((point) => point[`throttle_${unavailable}`] === null && point[`brake_${unavailable}`] === null)).toBe(true);
    expect(publication.drivers).toEqual(data.drivers);
    expect(data).toEqual(before);
  });

  it('mounts independent charts without changing article location, theme or storage', () => {
    window.history.replaceState({}, '', '/?article=42#paragraph');
    const url = window.location.href;
    const theme = document.documentElement.getAttribute('data-theme');
    const storage = { getItem: vi.fn(), setItem: vi.fn() };
    vi.stubGlobal('localStorage', storage);
    const { container } = render(<><TelemetryPlot data={plotFixture('speed', 'single')} width={340} /><TelemetryPlot data={plotFixture('pedals', 'teammates')} width={680} /></>);
    const ids = [...container.querySelectorAll('clipPath')].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelectorAll('svg.recharts-surface')).toHaveLength(2);
    expect(window.location.href).toBe(url);
    expect(document.documentElement.getAttribute('data-theme')).toBe(theme);
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
