import { Children, isValidElement, type ReactNode } from 'react';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { AlertTriangle, Code2, Loader2 } from 'lucide-react';
import type { OpenF1Driver } from '../../api/openf1';
import { teamColor } from '../../constants/colors';
import { cn } from './utils';

export function Spinner({ label }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-sm text-[color:var(--text-muted)]"><Loader2 size={16} className="animate-spin" />{label || 'Loading…'}</div>;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[2px] bg-[color:var(--surface-soft)]', className)} />;
}

export function ChartSkeleton({ label = 'Loading chart…', className }: { label?: string; className?: string }) {
  const bars = [34, 62, 46, 78, 55, 88, 50, 70];
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('rounded-[2px] border border-[color:var(--line)] bg-[color:var(--surface-soft-2)] p-4', className)}
    >
      <div className="flex h-full min-h-[120px] items-end gap-2">
        {bars.map((height, index) => (
          <div
            key={index}
            className="flex-1 animate-pulse rounded-t-[2px] bg-[color:var(--surface-soft)]"
            style={{ height: `${height}%`, animationDelay: `${index * 70}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function CardGridSkeleton({ count = 4, label = 'Loading cards…' }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="dashboard-card rounded-[2px] p-3">
          <SkeletonBlock className="mb-3 h-3 w-16" />
          <SkeletonBlock className="mb-2 h-7 w-20" />
          <SkeletonBlock className="h-2.5 w-full" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function TableSkeleton({ rows = 5, label = 'Loading rows…' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-2">
      <SkeletonBlock className="h-4 w-36" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid grid-cols-[54px_minmax(0,1fr)_72px] items-center gap-3">
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-6 w-full" />
          <SkeletonBlock className="h-4 w-full" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Err({ msg, actionLabel = 'Try again', onAction }: { msg: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div role="alert" className="error-state">
      <AlertTriangle size={18} className="mx-auto mb-2 opacity-60" />
      <p>{msg}</p>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-action"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function NoData({ msg }: { msg: string }) {
  return <div className="py-10 text-center text-sm text-[color:var(--text-muted)]">{msg}</div>;
}

export function Stat({ label, value, unit, markerColor }: { label: string; value: string | number; unit?: string; markerColor?: string }) {
  return (
    <div className="dashboard-stat">
      <div className="mb-1 flex items-center gap-[6px] text-[10px] font-medium text-[color:var(--text-muted)]">
        {markerColor && <i className="driver-marker" style={{ background: markerColor }} />}{label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-medium tabular-nums text-[color:var(--text-strong)]">{value}</span>
        {unit && <span className="text-[10px] text-[color:var(--text-muted)]">{unit}</span>}
      </div>
    </div>
  );
}

export function Panel({
  title,
  children,
  sub,
  className,
  headerRight,
  panelId,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  sub?: string;
  className?: string;
  headerRight?: ReactNode;
  panelId?: string;
}) {
  return (
    <div id={panelId} className={cn('dashboard-panel', className)}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {sub ? <p className="panel-caption">{sub}</p> : null}
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

export function DriverChip({ driver, selected, onClick }: {
  driver: OpenF1Driver;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="driver-option" aria-label={`${driver.full_name}, number ${driver.driver_number}`} aria-pressed={selected} onClick={onClick}>
      <span className="driver-marker" style={{ background: teamColor(driver.team_colour) }} />
      <span><strong>{driver.name_acronym}</strong><small>{driver.last_name}</small></span>
      <span className="driver-option-number">{selected ? '✓' : driver.driver_number}</span>
    </button>
  );
}

export function ToolbarButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      aria-pressed={active || undefined} className="utility-button">
      {icon}<span>{label}</span>
    </button>
  );
}

export function EmbedPanelButton({ onClick, label = 'Embed' }: { onClick: () => void; label?: string }) {
  return <ToolbarButton icon={<Code2 size={16} />} label={label} onClick={onClick} />;
}

type ChartTipPayload = {
  color?: string;
  name?: NameType;
  value?: ValueType;
  dataKey?: string | number;
};

/** Tooltip decimals follow each measurement's axis: whole km/h, %, rpm and ms; thousandths for lap seconds. */
const TIP_PRECISION: Record<string, number> = { s: 3, ms: 0, 'km/h': 0, '%': 0, rpm: 0 };

/** Fixed-precision value without a misleading "-0" when a small signed delta rounds to zero. */
function fixedValue(value: number, digits: number) {
  const text = value.toFixed(digits);
  return Number(text) === 0 ? text.replace('-', '') : text;
}

export function ChartTip({ active, payload, label, unit = '', labelPrefix = '', labelSuffix = '', absolute = false, discrete = false, format }: {
  active?: boolean; payload?: ChartTipPayload[]; label?: string | number;
  unit?: string; labelPrefix?: string; labelSuffix?: string; absolute?: boolean; discrete?: boolean;
  /** Replaces numeric formatting for coded values, e.g. DRS 0/1 → Closed/Open, matching the axis. */
  format?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const unitText = unit === '%' || unit === '°C' ? unit : unit && ` ${unit}`;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{labelPrefix}{label}{labelSuffix}</div>
      {payload.map((item, index) => (
        <div key={index} className="tooltip-row">
          <span className="driver-marker" style={{ backgroundColor: item.color }} />
          <span>{item.name}</span>
          <strong>{typeof item.value !== 'number' ? item.value : format ? format(item.value) : `${fixedValue(absolute ? Math.abs(item.value) : item.value, discrete ? 0 : TIP_PRECISION[unit] ?? 1)}${unitText}`}</strong>
        </div>
      ))}
    </div>
  );
}

export function PanelSelection({ children, embedMode }: { children: ReactNode; embedMode: boolean }) {
  const requested = embedMode ? window.location.hash.slice(1) : '';
  if (!requested) return children;
  const panels = Children.toArray(children).filter((child) =>
    isValidElement<{ panelId?: string }>(child) && (child.props.panelId === requested || child.key === `.$${requested}`),
  );
  return panels.length ? panels : <NoData msg="This panel is unavailable for the selected analysis." />;
}
