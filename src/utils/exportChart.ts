export type ExportChartLegendItem = {
  label: string;
  color: string;
  variant?: 'line' | 'area' | 'bar';
  dashed?: boolean;
};

type ExportChartOptions = {
  legend?: ExportChartLegendItem[];
  textColor: string;
  backgroundColor: string;
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFAULT_EXPORT_WIDTH = 1200;
const DEFAULT_EXPORT_HEIGHT = 480;
const LEGEND_PADDING_X_PX = 20;
const LEGEND_ROW_HEIGHT_PX = 22;
const LEGEND_MARKER_WIDTH_PX = 18;
const LEGEND_MARKER_GAP_PX = 10;
const LEGEND_ITEM_GAP_PX = 16;
const LEGEND_TOP_PADDING_PX = 26;
const LEGEND_ITEMS_PER_ROW_ESTIMATE = 4;
const APPROX_CHAR_WIDTH_PX = 7;

function getChartDimensions(svg: SVGSVGElement, fallbackWidth: number, fallbackHeight: number) {
  const widthAttr = Number(svg.getAttribute('width'));
  const heightAttr = Number(svg.getAttribute('height'));
  const viewBox = svg.viewBox.baseVal;

  return {
    width: Number.isFinite(widthAttr) && widthAttr > 0 ? widthAttr : (viewBox?.width || fallbackWidth || DEFAULT_EXPORT_WIDTH),
    height: Number.isFinite(heightAttr) && heightAttr > 0 ? heightAttr : (viewBox?.height || fallbackHeight || DEFAULT_EXPORT_HEIGHT),
  };
}

function appendLegend(
  root: SVGSVGElement,
  legend: ExportChartLegendItem[],
  chartHeight: number,
  chartWidth: number,
) {
  if (legend.length === 0) return;

  let cursorX = LEGEND_PADDING_X_PX;
  let cursorY = chartHeight + LEGEND_ROW_HEIGHT_PX;

  legend.forEach((item) => {
    const itemWidth = LEGEND_MARKER_WIDTH_PX + LEGEND_MARKER_GAP_PX + item.label.length * APPROX_CHAR_WIDTH_PX;
    if (cursorX + itemWidth > chartWidth - LEGEND_PADDING_X_PX) {
      cursorX = LEGEND_PADDING_X_PX;
      cursorY += LEGEND_ROW_HEIGHT_PX;
    }

    if (item.variant === 'bar') {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(cursorX));
      rect.setAttribute('y', String(cursorY - 9));
      rect.setAttribute('width', '14');
      rect.setAttribute('height', '14');
      rect.setAttribute('rx', '3');
      rect.setAttribute('fill', item.color);
      root.appendChild(rect);
    } else {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(cursorX));
      line.setAttribute('y1', String(cursorY - 2));
      line.setAttribute('x2', String(cursorX + LEGEND_MARKER_WIDTH_PX));
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

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', String(cursorX + LEGEND_MARKER_WIDTH_PX + 8));
    label.setAttribute('y', String(cursorY + 2));
    label.setAttribute('fill', 'currentColor');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-family', 'system-ui, sans-serif');
    label.textContent = item.label;
    root.appendChild(label);

    cursorX += itemWidth + LEGEND_ITEM_GAP_PX;
  });
}

function buildExportMarkup(svg: SVGSVGElement, options: Required<ExportChartOptions>) {
  const serializer = new XMLSerializer();
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  const parent = svg.parentElement as HTMLElement | null;
  const { width, height } = getChartDimensions(svg, parent?.clientWidth || DEFAULT_EXPORT_WIDTH, parent?.clientHeight || DEFAULT_EXPORT_HEIGHT);
  const legendRows = options.legend.length > 0 ? Math.ceil(options.legend.length / LEGEND_ITEMS_PER_ROW_ESTIMATE) : 0;
  const legendHeight = legendRows > 0 ? LEGEND_TOP_PADDING_PX + legendRows * LEGEND_ROW_HEIGHT_PX : 0;
  const totalHeight = height + legendHeight;

  const exportSvg = document.createElementNS(SVG_NS, 'svg');
  exportSvg.setAttribute('xmlns', SVG_NS);
  exportSvg.setAttribute('width', String(width));
  exportSvg.setAttribute('height', String(totalHeight));
  exportSvg.setAttribute('viewBox', `0 0 ${width} ${totalHeight}`);
  exportSvg.setAttribute('fill', 'none');
  exportSvg.setAttribute('color', options.textColor);

  const backgroundRect = document.createElementNS(SVG_NS, 'rect');
  backgroundRect.setAttribute('x', '0');
  backgroundRect.setAttribute('y', '0');
  backgroundRect.setAttribute('width', String(width));
  backgroundRect.setAttribute('height', String(totalHeight));
  backgroundRect.setAttribute('fill', options.backgroundColor);
  exportSvg.appendChild(backgroundRect);

  clonedSvg.setAttribute('x', '0');
  clonedSvg.setAttribute('y', '0');
  clonedSvg.setAttribute('width', String(width));
  clonedSvg.setAttribute('height', String(height));
  exportSvg.appendChild(clonedSvg);

  appendLegend(exportSvg, options.legend, height, width);

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

export function sanitizeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function exportChartAsSvg(
  svg: SVGSVGElement,
  filename: string,
  options: ExportChartOptions,
) {
  const markup = buildExportMarkup(svg, {
    legend: options.legend ?? [],
    textColor: options.textColor,
    backgroundColor: options.backgroundColor,
  });
  downloadSvg(filename, markup);
}
