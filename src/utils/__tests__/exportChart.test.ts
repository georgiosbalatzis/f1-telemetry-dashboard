import { afterEach, expect, it } from 'vitest';
import { buildExportMarkup, resolveCssVariables } from '../exportChart';

afterEach(() => document.documentElement.removeAttribute('style'));

const svgOf = (markup: string) => {
  const host = document.createElement('div');
  host.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`;
  return host.firstElementChild as SVGSVGElement;
};

it('P5-06: exported charts carry real colours instead of page-only CSS variables', () => {
  document.documentElement.style.setProperty('--chart-grid', '#d4d0c5');
  document.documentElement.style.setProperty('--accent', '#a82e1c');
  const svg = svgOf('<line stroke="var(--chart-grid)"/><path stroke="var(--accent)" fill="var(--missing, #123456)"/><g style="color: var(--accent)"><text fill="#000">x</text></g>');

  resolveCssVariables(svg);

  expect(svg.querySelector('line')?.getAttribute('stroke')).toBe('#d4d0c5');
  expect(svg.querySelector('path')?.getAttribute('stroke')).toBe('#a82e1c');
  expect(svg.querySelector('path')?.getAttribute('fill')).toBe('#123456'); // unknown variable falls back
  expect(svg.querySelector('g')?.getAttribute('style')).toBe('color: #a82e1c');
  expect(svg.querySelector('text')?.getAttribute('fill')).toBe('#000'); // plain values untouched
});

it('P5-06: exported charts carry the page-CSS grid colour and chart font', () => {
  document.documentElement.style.setProperty('--chart-grid', '#343739');
  document.documentElement.style.setProperty('--font-body', "'IBM Plex Sans', sans-serif");

  const markup = buildExportMarkup(svgOf('<g class="recharts-cartesian-grid"><line/></g>'), { legend: [], textColor: '#fff', backgroundColor: '#000' });

  expect(markup).toContain('.recharts-cartesian-grid line,.recharts-cartesian-axis-line,.recharts-cartesian-axis-tick-line{stroke:#343739}');
  expect(markup).toContain(".recharts-text{font-family:'IBM Plex Sans', sans-serif;");
  expect(markup).not.toContain('var(');
});
