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
