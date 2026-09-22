import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, Expand, Shrink } from 'lucide-react';
import { COLORS } from '../../constants/colors';
import { exportChartAsSvg, sanitizeFilename, type ExportChartLegendItem } from '../../utils/exportChart';
import { EmbedPanelButton, Panel, ToolbarButton } from './shared';
import { cn } from './utils';

export type ChartLegendItem = ExportChartLegendItem;

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

    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-strong').trim() || COLORS.fallback.exportText;
    const background = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || COLORS.fallback.exportBackground;
    void exportChartAsSvg(chartSvg, `${sanitizeFilename(exportName)}.svg`, {
      legend,
      textColor,
      backgroundColor: background,
    });
  };

  const actions = !embedMode && (
    <div className="dashboard-chart-actions">
      {headerRight}
      {panelId && onEmbedPanel && (
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
                  <svg width="32" height="10" role="img" aria-label={`${item.label} ${item.strokeDasharray || item.dashed ? 'dashed' : 'solid'} colour indicator`}>
                    {item.variant === 'bar'
                      ? <rect width="32" height="8" fill={item.color} />
                      : <line x1="0" y1="5" x2="32" y2="5" stroke={item.color} strokeWidth={item.variant === 'area' ? 6 : 2} strokeDasharray={item.strokeDasharray || (item.dashed ? '6 5' : undefined)} opacity={item.variant === 'area' ? 0.6 : 1} />}
                  </svg>
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
