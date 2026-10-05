import { createRoot } from 'react-dom/client';
import { TelemetryPlot } from './TelemetryPlot';
import { figureLegend } from './plotModel';
import { buildExportMarkup } from '../utils/exportChart';
import type { FigureImage, FigureTheme } from './contract';
import type { FigureData } from './contract';

const SURFACE_CSS = `
.surface{box-sizing:border-box;font-family:Arial,'DejaVu Sans',sans-serif;font-variant-numeric:tabular-nums;color:var(--text);background:var(--bg)}
.recharts-text{font-family:Arial,'DejaVu Sans',sans-serif;font-variant-numeric:tabular-nums}
.recharts-cartesian-grid line,.recharts-cartesian-axis-line,.recharts-cartesian-axis-tick-line{stroke:var(--chart-grid)}
`;

const THEME = {
  light: { bg: '#f2eee4', text: '#20251f', axis: '#5b6256', grid: '#c8c8b9', reference: '#858779' },
  dark: { bg: '#1b1a19', text: '#eee8db', axis: '#b6bbac', grid: '#4b5146', reference: '#777975' },
} as const;

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Figure export cancelled', 'AbortError');
}

function waitForChart(host: HTMLElement, signal?: AbortSignal) {
  return new Promise<SVGSVGElement>((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const svg = host.querySelector<SVGSVGElement>('svg.recharts-surface');
      if (svg) { clearTimeout(timeout); observer.disconnect(); resolve(svg); }
    });
    const timeout = window.setTimeout(() => { observer.disconnect(); reject(new Error('The chart did not finish rendering. Wait for telemetry to load and retry.')); }, 2000);
    observer.observe(host, { childList: true, subtree: true });
    signal?.addEventListener('abort', () => { clearTimeout(timeout); observer.disconnect(); reject(new DOMException('Figure export cancelled', 'AbortError')); }, { once: true });
    const existing = host.querySelector<SVGSVGElement>('svg.recharts-surface');
    if (existing) { clearTimeout(timeout); observer.disconnect(); resolve(existing); }
  });
}

async function renderVariant(data: FigureData, width: number, theme: FigureTheme, signal?: AbortSignal): Promise<FigureImage> {
  abortIfNeeded(signal);
  const host = document.createElement('div');
  host.className = 'surface';
  host.setAttribute('data-figure-theme', theme);
  Object.assign(host.style, { position: 'fixed', left: '-10000px', top: '0', width: `${width}px`, visibility: 'hidden', pointerEvents: 'none' });
  const palette = THEME[theme];
  for (const [name, value] of Object.entries({ '--bg': palette.bg, '--text': palette.text, '--font-body': "Arial, 'DejaVu Sans', sans-serif", '--chart-axis': palette.axis, '--chart-axis-soft': palette.axis, '--chart-grid': palette.grid, '--chart-reference': palette.reference })) {
    host.style.setProperty(name, value);
  }
  document.body.append(host);
  const style = document.createElement('style');
  style.textContent = SURFACE_CSS;
  host.append(style);
  const chartHost = document.createElement('div');
  chartHost.style.width = `${width}px`;
  host.append(chartHost);
  const root = createRoot(chartHost);
  try {
    root.render(<TelemetryPlot data={data} width={width} theme={theme} axisFontSize={16} />);
    if ('fonts' in document) await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    abortIfNeeded(signal);
    const svg = await waitForChart(chartHost, signal);
    const chartWidth = Number(svg.getAttribute('width')) || width;
    const chartHeight = Number(svg.getAttribute('height')) || 300;
    const markup = buildExportMarkup(svg, {
      legend: figureLegend(data, theme),
      textColor: palette.text,
      backgroundColor: palette.bg,
      legendFontSize: 16,
    }, host);
    return { svg: markup, width: chartWidth, height: Number(new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement.getAttribute('height')) || chartHeight };
  } finally {
    root.unmount();
    host.remove();
  }
}

/** Renders a fixed snapshot without touching dashboard theme, selection or page styles. */
export async function exportFigureImages(data: FigureData, signal?: AbortSignal) {
  const narrowWidth = 360;
  const wideWidth = 680;
  const [narrowLight, wideLight, narrowDark, wideDark] = await Promise.all([
    renderVariant(data, narrowWidth, 'light', signal),
    renderVariant(data, wideWidth, 'light', signal),
    renderVariant(data, narrowWidth, 'dark', signal),
    renderVariant(data, wideWidth, 'dark', signal),
  ]);
  return { narrowLight, wideLight, narrowDark, wideDark };
}
