import { describe, expect, it } from 'vitest';
import { exportFigureImages } from '../exportFigure';
import { plotFixture } from './fixtures';

describe('saved figure image renderer', () => {
  it('creates four self-contained themed variants with responsive dimensions and no dashboard side effects', async () => {
    window.history.replaceState({}, '', '/?story=123#telemetry');
    const href = window.location.href;
    const theme = document.documentElement.getAttribute('data-theme');
    const images = await exportFigureImages(plotFixture('pedals', 'teammates'));
    expect(Object.keys(images)).toEqual(['narrowLight', 'wideLight', 'narrowDark', 'wideDark']);
    for (const [key, image] of Object.entries(images)) {
      const doc = new DOMParser().parseFromString(image.svg, 'image/svg+xml');
      expect(doc.querySelector('parsererror')).toBeNull();
      expect(doc.documentElement.getAttribute('width')).toBe(String(image.width));
      expect(doc.documentElement.getAttribute('height')).toBe(String(image.height));
      expect(image.svg).not.toMatch(/var\s*\(|(?:xlink:)?(?:href|src)=["'](?:https?:|\/\/)|<foreignObject|<script/i);
      expect(image.svg).toContain('Throttle');
      expect(image.svg).toContain('Brake');
      expect(image.svg).toContain("font-family:Arial, 'DejaVu Sans', sans-serif");
      expect(doc.querySelectorAll('clipPath').length).toBeGreaterThan(0);
      const textSizes = [...doc.querySelectorAll('text')].map((node) => node.getAttribute('font-size')).filter((size): size is string => size !== null).map(Number).filter(Number.isFinite);
      expect(Math.min(...textSizes)).toBeGreaterThanOrEqual(12);
      expect(doc.documentElement.getAttribute('color')).toBe(key.toLowerCase().includes('dark') ? '#eee8db' : '#20251f');
    }
    expect(images.narrowLight.width).toBeLessThan(images.wideLight.width);
    expect(window.location.href).toBe(href);
    expect(document.documentElement.getAttribute('data-theme')).toBe(theme);
    expect(document.querySelectorAll('.surface')).toHaveLength(0);
  });
});
