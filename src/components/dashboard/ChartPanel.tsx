import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, Expand, Shrink } from 'lucide-react';
import { EmbedPanelButton, Panel, ToolbarButton } from './shared';
import { cn } from './utils';

export type ChartLegendItem = {
  label: string;
  color: string;
  variant?: 'line' | 'area' | 'bar';
  dashed?: boolean;
};

type Props = {
  title: string;
  icon?: ReactNode;
  sub?: string;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
  exportName: string;
  legend?: ChartLegendItem[];
  panelId?: string;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

function getChartDimensions(svg: SVGSVGElement, fallbackWidth: number, fallbackHeight: number) {
  const widthAttr = Number(svg.getAttribute('width'));
  const heightAttr = Number(svg.getAttribute('height'));
  const viewBox = svg.viewBox.baseVal;

  return {
    width: Number.isFinite(widthAttr) && widthAttr > 0 ? widthAttr : (viewBox?.width || fallbackWidth || 1200),
    height: Number.isFinite(heightAttr) && heightAttr > 0 ? heightAttr : (viewBox?.height || fallbackHeight || 480),
  };
}

function appendLegend(
  root: SVGSVGElement,
  legend: ChartLegendItem[],
  chartHeight: number,
  chartWidth: number,
) {
  if (legend.length === 0) return;

  const ns = 'http://www.w3.org/2000/svg';
  const paddingX = 20;
  const rowHeight = 22;
  const markerWidth = 18;
  const labelFactor = 7;
  let cursorX = paddingX;
  let cursorY = chartHeight + 22;

  legend.forEach((item) => {
    const itemWidth = markerWidth + 10 + item.label.length * labelFactor;
    if (cursorX + itemWidth > chartWidth - paddingX) {
      cursorX = paddingX;
      cursorY += rowHeight;
    }

    if (item.variant === 'bar') {
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', String(cursorX));
      rect.setAttribute('y', String(cursorY - 9));
      rect.setAttribute('width', '14');
      rect.setAttribute('height', '14');
      rect.setAttribute('rx', '3');
      rect.setAttribute('fill', item.color);
      root.appendChild(rect);
    } else {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', String(cursorX));
      line.setAttribute('y1', String(cursorY - 2));
      line.setAttribute('x2', String(cursorX + markerWidth));
      line.setAttribute('y2', String(cursorY - 2));
      line.setAttribute('stroke', item.color);
      line.setAttribute('stroke-width', item.variant === 'area' ? '8' : '4');
      line.setAttribute('stroke-linecap', 'round');
      if (item.variant === 'area') {
        line.setAttribute('stroke-opacity', '0.55');
      }
      if (item.dashed) {
        line.setAttribute('stroke-dasharray', '6 5');
      }
      root.appendChild(line);
    }

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', String(cursorX + markerWidth + 8));
    label.setAttribute('y', String(cursorY + 2));
    label.setAttribute('fill', 'currentColor');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-family', 'system-ui, sans-serif');
    label.textContent = item.label;
    root.appendChild(label);

    cursorX += itemWidth + 16;
  });
}

function buildExportMarkup(svg: SVGSVGElement, legend: ChartLegendItem[], background: string) {
  const serializer = new XMLSerializer();
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  const parent = svg.parentElement as HTMLElement | null;
  const { width, height } = getChartDimensions(svg, parent?.clientWidth || 1200, parent?.clientHeight || 480);
  const legendRows = legend.length > 0 ? Math.ceil(legend.length / 4) : 0;
  const legendHeight = legendRows > 0 ? 26 + legendRows * 22 : 0;
  const totalHeight = height + legendHeight;
  const ns = 'http://www.w3.org/2000/svg';

  const exportSvg = document.createElementNS(ns, 'svg');
  exportSvg.setAttribute('xmlns', ns);
  exportSvg.setAttribute('width', String(width));
  exportSvg.setAttribute('height', String(totalHeight));
  exportSvg.setAttribute('viewBox', `0 0 ${width} ${totalHeight}`);
  exportSvg.setAttribute('fill', 'none');
  exportSvg.setAttribute('color', getComputedStyle(document.documentElement).getPropertyValue('--text-strong').trim() || '#111113');

  const backgroundRect = document.createElementNS(ns, 'rect');
  backgroundRect.setAttribute('x', '0');
  backgroundRect.setAttribute('y', '0');
  backgroundRect.setAttribute('width', String(width));
  backgroundRect.setAttribute('height', String(totalHeight));
  backgroundRect.setAttribute('fill', background);
  exportSvg.appendChild(backgroundRect);

  clonedSvg.setAttribute('x', '0');
  clonedSvg.setAttribute('y', '0');
  clonedSvg.setAttribute('width', String(width));
  clonedSvg.setAttribute('height', String(height));
  exportSvg.appendChild(clonedSvg);

  appendLegend(exportSvg, legend, height, width);

  return serializer.serializeToString(exportSvg);
}

function downloadSvg(filename: string, markup: string) {
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function ChartPanel({
  title,
  icon,
  sub,
  children,
  className,
  headerRight,
  exportName,
  legend = [],
  panelId,
  embedMode = false,
  onEmbedPanel,
}: Props) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === frameRef.current);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    const frame = frameRef.current;
    if (!frame) return;

    if (document.fullscreenElement === frame) {
      await document.exitFullscreen();
      return;
    }

    await frame.requestFullscreen();
  };

  const handleDownload = () => {
    const chartSvg = chartRef.current?.querySelector('svg');
    if (!(chartSvg instanceof SVGSVGElement)) return;

    const background = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#111113';
    const markup = buildExportMarkup(chartSvg, legend, background);
    downloadSvg(`${sanitizeFilename(exportName)}.svg`, markup);
  };

  const actions = (
    <div className="dashboard-chart-actions">
      {headerRight}
      {embedMode && panelId && onEmbedPanel && (
        <EmbedPanelButton onClick={() => onEmbedPanel(panelId)} />
      )}
      <ToolbarButton icon={<Download size={12} />} label="Download" onClick={handleDownload} />
      <ToolbarButton
        icon={isFullscreen ? <Shrink size={12} /> : <Expand size={12} />}
        label={isFullscreen ? 'Exit Full' : 'Full Screen'}
        onClick={handleToggleFullscreen}
        active={isFullscreen}
      />
    </div>
  );

  return (
    <div ref={frameRef} className="dashboard-chart-frame">
      <Panel title={title} icon={icon} sub={sub} className={className} headerRight={actions} panelId={panelId}>
        <div className="space-y-3">
          <div ref={chartRef} className={cn('dashboard-chart-stage', isFullscreen && 'min-h-[70vh]')}>
            {children}
          </div>
          {legend.length > 0 && (
            <div className="dashboard-chart-legend">
              {legend.map((item) => (
                <span key={`${item.label}-${item.color}-${item.variant || 'line'}-${item.dashed ? 'dashed' : 'solid'}`} className="dashboard-chart-legend-item">
                  <span
                    className={cn(
                      'dashboard-chart-legend-swatch',
                      item.variant === 'bar' ? 'rounded-[3px]' : 'rounded-full',
                    )}
                    aria-label={`${item.label} colour indicator`}
                    role="img"
                    style={{
                      background: item.variant === 'bar' ? item.color : undefined,
                      borderBottomStyle: item.dashed ? 'dashed' : 'solid',
                      borderBottomColor: item.variant === 'bar' ? 'transparent' : item.color,
                      opacity: item.variant === 'area' ? 0.6 : 1,
                    }}
                  />
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
