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

export type FigureLabels = { title: string; source: string; caption?: string };

function labelImage(markup: string, width: number, labels: FigureLabels) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const svg = doc.documentElement;
  const oldHeight = Number(svg.getAttribute('height'));
  const padding = 18;
  const lines = (text: string, size: number) => {
    const words = text.split(/\s+/); const result: string[] = []; let line = '';
    for (const word of words) { if ((line + word).length * size * .56 > width - 2 * padding && line) { result.push(line.trim()); line = ''; } line += word + ' '; }
    if (line) result.push(line.trim()); return result;
  };
  const titleLines = lines(labels.title, 18);
  const footerLines = lines([labels.source, labels.caption].filter(Boolean).join(' · '), 12);
  const top = titleLines.length * 23 + 22;
  const bottom = footerLines.length * 17 + 20;
  const contents = [...svg.childNodes];
  const group = doc.createElementNS('http://www.w3.org/2000/svg', 'g'); group.setAttribute('transform', `translate(0 ${top})`);
  contents.forEach(node => group.appendChild(node)); svg.appendChild(group);
  const bg = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', String(width)); bg.setAttribute('height', String(top + oldHeight + bottom));
  const color = group.querySelector('rect')?.getAttribute('fill') ?? '#f2eee4'; bg.setAttribute('fill', color); svg.prepend(bg);
  const append = (text: string, y: number, size: number) => { const node = doc.createElementNS('http://www.w3.org/2000/svg', 'text'); node.setAttribute('x', String(padding)); node.setAttribute('y', String(y)); node.setAttribute('fill', 'currentColor'); node.setAttribute('font-family', 'Arial, sans-serif'); node.setAttribute('font-size', String(size)); node.textContent = text; svg.appendChild(node); };
  titleLines.forEach((line, i) => append(line, 27 + 23 * i, 18));
  footerLines.forEach((line, i) => append(line, top + oldHeight + 16 + 17 * i, 12));
  svg.setAttribute('height', String(top + oldHeight + bottom)); svg.setAttribute('viewBox', `0 0 ${width} ${top + oldHeight + bottom}`);
  return new XMLSerializer().serializeToString(svg);
}

async function renderVariant(data: FigureData, width: number, theme: FigureTheme, signal?: AbortSignal, labels?: FigureLabels): Promise<FigureImage> {
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
    let markup = buildExportMarkup(svg, {
      legend: figureLegend(data, theme),
      textColor: palette.text,
      backgroundColor: palette.bg,
      legendFontSize: 16,
    }, host);
    if (labels) markup = labelImage(markup, width, labels);
    return { svg: markup, width: chartWidth, height: Number(new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement.getAttribute('height')) || chartHeight };
  } finally {
    root.unmount();
    host.remove();
  }
}

/** Renders a fixed snapshot without touching dashboard theme, selection or page styles. */
export async function exportFigureImages(data: FigureData, signal?: AbortSignal, labels?: FigureLabels) {
  const narrowWidth = 360;
  const wideWidth = 680;
  const [narrowLight, wideLight, narrowDark, wideDark] = await Promise.all([
    renderVariant(data, narrowWidth, 'light', signal, labels),
    renderVariant(data, wideWidth, 'light', signal, labels),
    renderVariant(data, narrowWidth, 'dark', signal, labels),
    renderVariant(data, wideWidth, 'dark', signal, labels),
  ]);
  return { narrowLight, wideLight, narrowDark, wideDark };
}

/** Rasterize the same self-contained SVG at publication resolution, retaining its axes and annotations. */
export async function figurePng(image: FigureImage, scale = 3): Promise<Blob> {
  if (!Number.isFinite(scale) || scale < 1 || scale > 4) throw new Error('PNG scale must be between 1 and 4.');
  const url = URL.createObjectURL(new Blob([image.svg], { type: 'image/svg+xml' }));
  try {
    const bitmap = new Image(); bitmap.src = url;
    await bitmap.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width * scale; canvas.height = image.height * scale;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('PNG canvas is unavailable.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed.')), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}

/** Stack synchronized saved panels without rasterizing their SVG geometry. */
export function stackFigureImages(images: FigureImage[]): FigureImage {
  if (!images.length || images.some(image => image.width !== images[0].width)) throw new Error('Synchronized panels must have the same width.');
  const doc = document.implementation.createDocument('http://www.w3.org/2000/svg', 'svg');
  const root = doc.documentElement;
  let height = 0;
  for (const image of images) {
    const parsed = new DOMParser().parseFromString(image.svg, 'image/svg+xml');
    if (parsed.querySelector('parsererror')) throw new Error('Invalid SVG panel.');
    const nested = doc.importNode(parsed.documentElement, true);
    nested.setAttribute('y', String(height)); root.appendChild(nested); height += image.height;
  }
  root.setAttribute('width', String(images[0].width)); root.setAttribute('height', String(height)); root.setAttribute('viewBox', `0 0 ${images[0].width} ${height}`);
  return { svg: new XMLSerializer().serializeToString(root), width: images[0].width, height };
}
